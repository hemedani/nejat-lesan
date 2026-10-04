"use client";

import { useEffect, useState } from "react";

import type { Binding, FieldNode, FormDefinition } from "@forms";

import {
	getBindableRelations,
	type BindableRelation,
} from "@/app/actions/form_definition/getBindableRelations";
import { FORM_KIND_LABELS, type FormKind } from "./form-types";

/**
 * What a bound answer writes into.
 *
 * This is the piece that makes a form's answers *count*. Without a binding, an
 * answer only lands in `dynamic_answers` — a flat snapshot that no aggregation can
 * join. With one, it becomes a real relation on the target model, so the same
 * charts that read accidents read form-filed reports.
 *
 * The choices are not a hand-written list: they come from
 * `form_definition.getBindableRelations`, which reads the target model's own
 * relations. The two lists that used to exist — the builder's and the mobile
 * mapper's — had drifted from the model, and a binding to a relation the model
 * lacked was silently discarded at submit time.
 */
export function BindingEditor({
	node,
	formKind,
	definition,
	onPatch,
}: {
	node: FieldNode;
	formKind: FormKind;
	definition: FormDefinition;
	onPatch: (patch: Partial<FieldNode>) => void;
}) {
	const [relations, setRelations] = useState<BindableRelation[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let alive = true;
		setLoading(true);
		void (async () => {
			try {
				const { relations } = await getBindableRelations({ set: { formKind } });
				if (alive) setRelations(relations);
			} catch {
				if (alive) setRelations([]);
			} finally {
				if (alive) setLoading(false);
			}
		})();
		return () => {
			alive = false;
		};
	}, [formKind]);

	const binding = node.binding;
	// A binding inside a repeatable row writes into that row's DTO rather than a
	// relation, so it has its own editor.
	const inRepeatable = definition.pages.some((page) =>
		(page.sections ?? []).some((section) =>
			(section.nodes ?? []).some((candidate) =>
				candidate.kind === "repeatable" &&
				(candidate.children ?? []).some((child) => child.key === node.key),
			),
		),
	);

	// `dynamic` binds to nothing, so it has no path to preselect.
	const selectedPath = !binding || binding.kind === "dynamic"
		? ""
		: binding.kind === "dto"
		? binding.dto
		: binding.path;

	return (
		<div className="rounded-lg border border-white/10 bg-white/[.04] p-3">
			<p className="text-sm font-medium">ذخیره پاسخ در</p>
			<p className="mt-1 mb-2 text-xs text-slate-400">
				محل ذخیرهٔ پاسخ این پرسش در مدل «
				{FORM_KIND_LABELS[formKind]}» تعیین می‌کند. بدون اتصال، پاسخ فقط
				به‌صورت متن آزاد ذخیره می‌شود و در تحلیل‌ها قابل استفاده نیست.
			</p>

			<select
				className="w-full rounded-lg border border-white/10 bg-white/[.04] p-2 text-sm"
				value={selectedPath ?? ""}
				disabled={loading}
				onChange={(event) => {
					const value = event.target.value;
					if (!value) {
						onPatch({ binding: undefined });
						return;
					}
					const relation = relations.find((row) => row.path === value);
					if (inRepeatable) {
						onPatch({
							binding: {
								kind: "dto",
								dto: value,
								field: node.key,
								from: node.key,
							} satisfies Binding,
						});
						return;
					}
					onPatch({
						binding: {
							kind: "relation",
							path: value,
							multi: relation?.multi,
						} satisfies Binding,
					});
				}}
			>
				<option value="">
					{loading ? "در حال دریافت…" : "ذخیره آزاد (بدون اتصال)"}
				</option>
				{relations.map((relation) => (
					<option key={relation.path} value={relation.path}>
						{relation.path}
						{relation.multi ? " (چند انتخابی)" : ""}
						{relation.required ? " — الزامی" : ""}
					</option>
				))}
			</select>

			{binding?.kind === "relation" && (
				<p className="mt-2 text-[11px] text-slate-400">
					کلید ارسالی:{" "}
					<code className="rounded bg-white/[.06] px-1">
						{relationSetKeyFor(binding.path, binding.multi)}
					</code>
				</p>
			)}
		</div>
	);
}

/**
 * The wire key a binding produces.
 *
 * Mirrors `relationSetKey` in `@forms` so the builder shows the officer exactly
 * what is sent, and so a mismatch is visible here rather than at submit time.
 */
const relationSetKeyFor = (path: string, multi?: boolean): string => {
	const camel = path
		.split("_")
		.map((part, index) =>
			index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
		)
		.join("");
	return multi ? `${camel}Ids` : `${camel}Id`;
};
