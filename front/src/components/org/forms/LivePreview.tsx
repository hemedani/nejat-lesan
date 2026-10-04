"use client";

/**
 * Live preview.
 *
 * Renders the definition with the *real* shared engine, so what an org admin
 * sees while authoring is exactly what an officer will get. A separate preview
 * implementation would inevitably drift from the engine and quietly mislead.
 */

import { useMemo, useState } from "react";
import type { AnswerTree, AnswerValue, FormDefinition } from "@forms";
import { isNodeVisible, validateForm, visiblePages } from "@forms";
import { findNodeIn, literalOptions } from "./form-types";

export function LivePreview({ definition }: { definition: FormDefinition }) {
	const [answers, setAnswers] = useState<AnswerTree>({});

	const pages = useMemo(() => visiblePages(definition, answers), [definition, answers]);
	const [pageIndex, setPageIndex] = useState(0);
	const page = pages[Math.min(pageIndex, Math.max(pages.length - 1, 0))];
	const result = useMemo(() => validateForm(definition, answers), [definition, answers]);

	if (definition.pages.length === 0) {
		return (
			<div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
				پیش‌نمایش پس از افزودن اولین صفحه نمایش داده می‌شود.
			</div>
		);
	}

	if (!page) {
		return (
			<div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-6 text-sm text-amber-100">
				با پاسخ‌های فعلی هیچ صفحه‌ای نمایش داده نمی‌شود. شرط‌های نمایش را بررسی کنید.
			</div>
		);
	}

	const errorsFor = (nodeKey: string) =>
		result.errors.filter((issue) => issue.nodeKey === nodeKey);
	const warningsFor = (nodeKey: string) =>
		result.warnings.filter((issue) => issue.nodeKey === nodeKey);

	return (
		<div className="space-y-4" dir="rtl">
			<div className="flex flex-wrap gap-1 rounded-lg bg-slate-800 p-1">
				{pages.map((candidate, index) => (
					<button
						key={candidate.key}
						type="button"
						onClick={() => setPageIndex(index)}
						className={[
							"flex-1 rounded-md px-3 py-1.5 text-xs",
							index === pageIndex
								? "bg-blue-400/10 text-blue-200 font-medium shadow-[0_0_20px_rgba(37,99,235,.12)]"
								: "text-slate-400 hover:bg-white/[.06] hover:text-white",
						].join(" ")}
					>
						{candidate.title}
						{result.blockedPages.includes(candidate.key) && (
							<span className="mr-1 text-rose-400">•</span>
						)}
					</button>
				))}
			</div>

			<div className="space-y-4">
				{page.sections?.map((section) => (
					<div key={section.key} className="rounded-xl border border-white/10 p-3">
						<h4 className="mb-2 text-sm font-semibold">{section.title}</h4>
						<div className="space-y-3">
							{section.nodes?.map((node) => (
								<PreviewNode
									key={node.key}
									node={node}
									definition={definition}
									answers={answers}
									onChange={(next) => setAnswers(next)}
									errors={errorsFor(node.key)}
									warnings={warningsFor(node.key)}
								/>
							))}
						</div>
					</div>
				))}
			</div>

			{result.warnings.length > 0 && (
				<div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3">
					<strong className="text-sm text-amber-100">
						هشدار ({result.warnings.length})
					</strong>
					<ul className="mt-1 list-disc pr-5 text-sm text-amber-100">
						{result.warnings.map((issue, index) => (
							<li key={index}>{issue.message}</li>
						))}
					</ul>
					<p className="mt-1 text-xs text-amber-100">
						هشدارها مانع ارسال گزارش نیستند و فقط برای بازبینی هستند.
					</p>
				</div>
			)}

			<div className="rounded-xl border border-white/10 p-3 text-sm">
				<strong>وضعیت: </strong>
				{result.errors.length === 0 ? (
					<span className="text-emerald-200">آماده ارسال</span>
				) : (
					<span className="text-rose-300">
						{result.errors.length} خطا باقی مانده است
					</span>
				)}
			</div>
		</div>
	);
}

function PreviewNode({
	node,
	definition,
	answers,
	onChange,
	errors,
	warnings,
}: {
	node: NonNullable<NonNullable<FormDefinition["pages"][number]["sections"]>[number]["nodes"]>[number];
	definition: FormDefinition;
	answers: AnswerTree;
	onChange: (next: AnswerTree) => void;
	errors: Array<{ message: string }>;
	warnings: Array<{ message: string }>;
}) {
	// Hidden nodes render nothing, exactly as they will for the officer.
	if (!isNodeVisible(node, answers)) return null;

	if (node.kind === "group") {
		return (
			<div className="space-y-3 rounded-lg border border-white/10 p-2">
				{node.label && <span className="text-xs text-slate-400">{node.label}</span>}
				{node.children.map((child) => (
					<PreviewNode
						key={child.key}
						node={child}
						definition={definition}
						answers={answers}
						onChange={onChange}
						errors={errors}
						warnings={warnings}
					/>
				))}
			</div>
		);
	}

	if (node.kind === "repeatable") {
		const rows = Array.isArray(answers[node.key])
			? (answers[node.key] as Array<Record<string, AnswerValue>>)
			: [];
		return (
			<div className="rounded-lg border border-dashed border-white/10 p-2">
				<div className="mb-2 flex items-center justify-between">
					<span className="text-sm font-medium">{node.label}</span>
					<button
						type="button"
						className="rounded-lg border border-emerald-400/40 px-2 py-1 text-xs text-emerald-200"
						onClick={() =>
							onChange({ ...answers, [node.key]: [...rows, {}] })
						}
					>
						+ افزودن
					</button>
				</div>
				{rows.map((row, index) => (
					<div key={index} className="mb-2 rounded-lg bg-white/[.04] p-2">
						<div className="mb-1 flex items-center justify-between text-xs text-slate-400">
							<span>{node.itemLabel ?? `${node.label} ${index + 1}`}</span>
							<button
								type="button"
								className="text-rose-400"
								onClick={() =>
									onChange({
										...answers,
										[node.key]: rows.filter((_, i) => i !== index),
									})
								}
							>
								حذف
							</button>
						</div>
						<div className="space-y-2">
							{node.children.map((child) => (
								<PreviewField
									key={child.key}
									node={child}
									definition={definition}
									answers={answers}
									row={row}
									onRowChange={(next) => {
										const copy = [...rows];
										copy[index] = next;
										onChange({ ...answers, [node.key]: copy });
									}}
								/>
							))}
						</div>
					</div>
				))}
				{errors.map((issue, i) => (
					<p key={i} className="text-xs text-rose-400">
						{issue.message}
					</p>
				))}
			</div>
		);
	}

	const options = literalOptions(node);
	const value = answers[node.key];

	return (
		<div>
			<label className="mb-1 block text-sm font-medium">{node.label}</label>
			{node.description && (
				<p className="mb-1 text-xs text-slate-400">{node.description}</p>
			)}

			{node.type === "textarea" ? (
				<textarea
					className="w-full rounded-lg border border-white/10 p-2 text-sm"
					value={String(value ?? "")}
					onChange={(event) => onChange({ ...answers, [node.key]: event.target.value })}
				/>
			) : node.type === "boolean" || options.length > 0 ? (
				<div className="flex flex-wrap gap-1">
					{options.map((option) => {
						const selected =
							node.type === "multi_select"
								? Array.isArray(value) && value.includes(option.value)
								: value === option.value;
						return (
							<button
								key={option.value}
								type="button"
								onClick={() => {
									if (node.type === "multi_select") {
										const current = Array.isArray(value) ? (value as string[]) : [];
										onChange({
											...answers,
											[node.key]: selected
												? current.filter((item) => item !== option.value)
												: [...current, option.value],
										});
										return;
									}
									// Deselecting removes the key entirely rather than storing
									// `undefined`: "not answered" and "answered empty" differ to
									// the engine's `exists`/`empty` rules.
									const next = { ...answers };
									if (selected) delete next[node.key];
									else next[node.key] = option.value;
									onChange(next);
								}}
								className={[
									"rounded-lg border px-3 py-1.5 text-xs",
									selected
										? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
										: "border-white/10 hover:bg-white/[.04]",
									option.tone === "danger" && !selected
										? "border-rose-400/50 text-rose-300"
										: "",
								].join(" ")}
							>
								{option.label}
							</button>
						);
					})}
				</div>
			) : node.type === "reference" ? (
				<p className="text-sm text-slate-400">
					گزینه‌ها از مدل «
					{node.options?.kind === "reference" ? node.options.model : ""}» در سرور خوانده
					می‌شوند.
				</p>
			) : (
				<input
					type={node.type === "number" ? "number" : "text"}
					className="w-full rounded-lg border border-white/10 p-2 text-sm"
					value={String(value ?? "")}
					onChange={(event) => onChange({ ...answers, [node.key]: event.target.value })}
				/>
			)}

			{errors.map((issue, index) => (
				<p key={index} className="mt-1 text-xs text-rose-400">
					{issue.message}
				</p>
			))}
			{warnings.map((issue, index) => (
				<p key={index} className="mt-1 text-xs text-amber-200">
					⚠ {issue.message}
				</p>
			))}
		</div>
	);
}

/** Field inside a repeatable row: reads and writes the row, not the root. */
function PreviewField({
	node,
	definition,
	answers,
	row,
	onRowChange,
}: {
	node: { key: string; label?: string; type?: string };
	definition: FormDefinition;
	answers: AnswerTree;
	row: Record<string, AnswerValue>;
	onRowChange: (next: Record<string, AnswerValue>) => void;
}) {
	const resolved = findNodeIn(definition, node.key);
	if (!resolved || resolved.kind !== "field") return null;
	if (!isNodeVisible(resolved, answers, [row])) return null;

	const options = literalOptions(resolved);
	const value = row[resolved.key];

	return (
		<div>
			<label className="mb-1 block text-xs font-medium">{resolved.label}</label>
			{options.length > 0 ? (
				<div className="flex flex-wrap gap-1">
					{options.map((option) => (
						<button
							key={option.value}
							type="button"
							onClick={() => onRowChange({ ...row, [resolved.key]: option.value })}
							className={[
								"rounded border px-2 py-1 text-[11px]",
								value === option.value
									? "border-emerald-400/40 bg-emerald-400/10"
									: "border-white/10",
							].join(" ")}
						>
							{option.label}
						</button>
					))}
				</div>
			) : (
				<input
					className="w-full rounded border border-white/10 p-1.5 text-xs"
					value={String(value ?? "")}
					onChange={(event) =>
						onRowChange({ ...row, [resolved.key]: event.target.value })
					}
				/>
			)}
		</div>
	);
}