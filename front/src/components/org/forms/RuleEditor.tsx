"use client";

/**
 * Interactive rule-tree editor.
 *
 * Lets an org admin express "اگر … و … آنگاه" without writing code, and shows a
 * Persian readback of the resulting rule so a mis-authored condition is visible
 * before it is published. Also warns about paths that do not resolve, because a
 * dangling path silently evaluates to false — the worst outcome, since the
 * author believes a field is conditional and it silently is not.
 */

import { useState } from "react";
import type { FormDefinition, Rule } from "@forms";
import { allFieldKeys, literalOptions, findNodeIn } from "./form-types";
import { LEAF_OPS, describeRule, unresolvedRulePaths } from "./rule-editor";

type AnyRule = Rule & Record<string, unknown>;

export function RuleEditor({
	title,
	hint,
	rule,
	definition,
	labels,
	excludeKey,
	onChange,
}: {
	title: string;
	hint: string;
	rule?: Rule;
	definition: FormDefinition;
	labels: Map<string, string>;
	excludeKey?: string;
	onChange: (rule: Rule | undefined) => void;
}) {
	const [open, setOpen] = useState(false);
	const fields = allFieldKeys(definition).filter((field) => field.key !== excludeKey);
	const knownPaths = allFieldKeys(definition).map((field) => field.path);
	const unresolved = unresolvedRulePaths(rule, knownPaths);

	if (fields.length === 0) {
		return (
			<div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-500">
				پس از افزودن فیلد دیگر، می‌توانید شرط تعریف کنید.
			</div>
		);
	}

	return (
		<div className="rounded-lg border border-gray-200">
			<button
				type="button"
				className="flex w-full items-center justify-between p-3 text-right"
				onClick={() => setOpen((value) => !value)}
			>
				<span className="text-sm font-medium">{title}</span>
				<span className="text-xs text-gray-500">
					{rule ? describeRule(rule, labels) || "تنظیم شده" : "بدون شرط"}
				</span>
			</button>

			{open && (
				<div className="space-y-3 border-t border-gray-200 p-3">
					<p className="text-xs text-gray-500">{hint}</p>

					{rule && (
						<div className="rounded-lg bg-teal-50 p-3 text-sm">
							<strong>معنی شرط:</strong> {describeRule(rule, labels)}
						</div>
					)}

					{unresolved.length > 0 && (
						<div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
							<strong>هشدار:</strong> این شرط به فیلدی اشاره می‌کند که وجود ندارد (
							{unresolved.join("، ")}) و هرگز برقرار نخواهد شد.
						</div>
					)}

					<div className="flex flex-wrap gap-2">
						<RuleButton
							label="همیشه"
							onClick={() => onChange({ op: "always" })}
							active={rule?.op === "always"}
						/>
						<RuleButton
							label="شرط ساده"
							onClick={() =>
								onChange({
									op: "eq",
									path: fields[0].path,
									value: "",
								} as Rule)
							}
							active={Boolean(rule && rule.op !== "and" && rule.op !== "or")}
						/>
						<RuleButton
							label="همه شرط‌ها (و)"
							onClick={() =>
								onChange({
									op: "and",
									rules: [
										{ op: "eq", path: fields[0].path, value: "" },
										{ op: "eq", path: fields[1]?.path ?? fields[0].path, value: "" },
									],
								})
							}
							active={rule?.op === "and"}
						/>
						<RuleButton
							label="یکی از شرط‌ها (یا)"
							onClick={() =>
								onChange({
									op: "or",
									rules: [
										{ op: "eq", path: fields[0].path, value: "" },
										{ op: "eq", path: fields[1]?.path ?? fields[0].path, value: "" },
									],
								})
							}
							active={rule?.op === "or"}
						/>
						{rule && (
							<RuleButton
								label="حذف شرط"
								onClick={() => onChange(undefined)}
								active={false}
								danger
							/>
						)}
					</div>

					{rule && rule.op !== "always" && (
						<RuleTreeEditor
							rule={rule as AnyRule}
							definition={definition}
							labels={labels}
							onChange={onChange}
						/>
					)}
				</div>
			)}
		</div>
	);
}

function RuleButton({
	label,
	onClick,
	active,
	danger,
}: {
	label: string;
	onClick: () => void;
	active: boolean;
	danger?: boolean;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={[
				"rounded-lg border px-3 py-1.5 text-xs",
				active
					? "border-teal-600 bg-teal-50 text-teal-800"
					: "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
				danger ? "border-red-300 text-red-600" : "",
			].join(" ")}
		>
			{label}
		</button>
	);
}

// ---------------------------------------------------------------------------

function RuleTreeEditor({
	rule,
	definition,
	labels,
	onChange,
}: {
	rule: AnyRule;
	definition: FormDefinition;
	labels: Map<string, string>;
	onChange: (rule: Rule) => void;
}) {
	if (rule.op === "and" || rule.op === "or") {
		const children = (rule.rules as AnyRule[] | undefined) ?? [];
		return (
			<div className="space-y-2 rounded-lg border border-dashed border-gray-300 p-3">
				{children.map((child, index) => (
					<div key={index} className="space-y-2">
						<div className="flex items-center justify-between text-xs text-gray-500">
							<span>{rule.op === "and" ? "و" : "یا"}</span>
							{children.length > 2 && (
								<button
									type="button"
									className="text-red-600 hover:underline"
									onClick={() =>
										onChange({
											...rule,
											rules: children.filter((_, i) => i !== index),
										} as Rule)
									}
								>
									حذف
								</button>
							)}
						</div>
						<RuleTreeEditor
							rule={child}
							definition={definition}
							labels={labels}
							onChange={(next) => {
								const updated = [...children];
								updated[index] = next as AnyRule;
								onChange({ ...rule, rules: updated } as Rule);
							}}
						/>
					</div>
				))}
				<button
					type="button"
					className="text-xs text-teal-700 hover:underline"
					onClick={() =>
						onChange({
							...rule,
							rules: [
								...children,
								{ op: "eq", path: definitionFields(definition)[0]?.path ?? "", value: "" },
							],
						} as Rule)
					}
				>
					+ افزودن شرط
				</button>
			</div>
		);
	}

	const allFields = definitionFields(definition);
	const currentOpEntry = LEAF_OPS.find((entry) => entry.op === rule.op);
	const rootKey = String(rule.path ?? "").split(/[.[]/)[0];
	const sourceNode = findNodeIn(definition, rootKey);
	const valueOptions = sourceNode ? literalOptions(sourceNode) : [];

	return (
		<div className="flex flex-wrap items-center gap-2">
			<select
				className="rounded-lg border border-gray-300 p-2 text-sm"
				value={String(rule.path ?? "")}
				onChange={(event) => onChange({ ...rule, path: event.target.value } as Rule)}
			>
				{allFields.map((field) => (
					<option key={field.path} value={field.path}>
						{field.label}
					</option>
				))}
			</select>

			<select
				className="rounded-lg border border-gray-300 p-2 text-sm"
				value={rule.op}
				onChange={(event) => {
					const next = LEAF_OPS.find((entry) => entry.op === event.target.value);
					onChange({
						op: event.target.value,
						path: rule.path,
						...(next?.needsValue ? { value: rule.value ?? "" } : {}),
					} as Rule);
				}}
			>
				{LEAF_OPS.map((entry) => (
					<option key={entry.op} value={entry.op}>
						{entry.label}
					</option>
				))}
			</select>

			{rule.op === "count" ? (
				<div className="flex items-center gap-1 text-xs text-gray-600">
					<input
						type="number"
						className="w-20 rounded-lg border border-gray-300 p-1.5"
						placeholder="حداقل"
						value={rule.gte ?? ""}
						onChange={(event) =>
							onChange({
								...rule,
								gte: event.target.value === "" ? undefined : Number(event.target.value),
							} as Rule)
						}
					/>
					<span>تا</span>
					<input
						type="number"
						className="w-20 rounded-lg border border-gray-300 p-1.5"
						placeholder="حداکثر"
						value={rule.lte ?? ""}
						onChange={(event) =>
							onChange({
								...rule,
								lte: event.target.value === "" ? undefined : Number(event.target.value),
							} as Rule)
						}
					/>
				</div>
			) : currentOpEntry?.needsValue ? (
				valueOptions.length > 0 ? (
					<select
						className="rounded-lg border border-gray-300 p-2 text-sm"
						value={Array.isArray(rule.value) ? (rule.value as string[])[0] ?? "" : String(rule.value ?? "")}
						onChange={(event) =>
							onChange({
								...rule,
								// `in`/`anyIn`/`nin`/`everyIn` take a list.
								value: ["in", "nin", "anyIn", "everyIn"].includes(rule.op)
									? [event.target.value]
									: event.target.value,
							} as Rule)
						}
					>
						<option value="">انتخاب کنید</option>
						{valueOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				) : (
					<input
						className="rounded-lg border border-gray-300 p-2 text-sm"
						value={Array.isArray(rule.value) ? (rule.value as string[]).join("، ") : String(rule.value ?? "")}
						onChange={(event) =>
							onChange({
								...rule,
								value: ["in", "nin", "anyIn", "everyIn"].includes(rule.op)
									? event.target.value
											.split("،")
											.map((part) => part.trim())
											.filter(Boolean)
									: event.target.value,
							} as Rule)
						}
						placeholder="مقدار (برای چند مقدار با ، جدا کنید)"
					/>
				)
			) : null}
		</div>
	);
}

const definitionFields = (definition: FormDefinition) =>
	allFieldKeys(definition);