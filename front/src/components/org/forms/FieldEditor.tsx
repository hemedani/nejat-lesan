"use client";

/**
 * Per-field property editor.
 *
 * Everything an org admin can set on a field lives here, including the three
 * condition slots (`visibleWhen`, `requiredWhen`, `optionsFilter`) and the
 * cascade list. Kept separate from the tree so editing a deep field's options
 * does not re-render the whole builder.
 */

import { useEffect, useState } from "react";
import type { FieldNode, FormIconName, OptionItem } from "@forms";
import {
	FIELD_TYPE_LABELS,
	OPTION_BEARING_TYPES,
	REFERENCE_MODEL_LABELS,
	allFieldKeys,
	type FormKind,
} from "./form-types";
import { getReferenceModels, type ReferenceModelInfo } from "@/app/actions/form_definition/getReferenceModels";
import { RuleEditor } from "./RuleEditor";
import { IconPicker } from "./IconPicker";
import { BindingEditor } from "./BindingEditor";
import MyInput from "@/components/atoms/MyInput";

/**
 * The models a `reference` question may draw options from, asked of the backend.
 *
 * The builder used to keep its own hardcoded list, which had drifted sixteen
 * models behind the server's allow-list — so it could offer a model the backend
 * rejects, and hide one the backend allows. The backend is the only list.
 */
function useReferenceModels(): {
	models: ReferenceModelInfo[];
	loading: boolean;
} {
	const [models, setModels] = useState<ReferenceModelInfo[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let alive = true;
		void (async () => {
			try {
				const { models } = await getReferenceModels();
				if (alive) setModels(models);
			} catch {
				if (alive) setModels([]);
			} finally {
				if (alive) setLoading(false);
			}
		})();
		return () => {
			alive = false;
		};
	}, []);

	return { models, loading };
}

export function FieldEditor({
	node,
	definition,
	formKind = "accident",
	onPatch,
}: {
	node: FieldNode;
	definition: Parameters<typeof allFieldKeys>[0];
	/** Decides which relations a question may bind to. */
	formKind?: FormKind;
	onPatch: (patch: Partial<FieldNode>) => void;
}) {
	const fields = allFieldKeys(definition);
	const labels = new Map(fields.map((field) => [field.key, field.label]));
	const referenceModels = useReferenceModels();
	const currentModel =
		node.options?.kind === "reference" ? node.options.model : undefined;
	// `activate` refuses a definition whose reference source is empty, so warn here
	// rather than letting the author discover it at publish time.
	const selectedModel = referenceModels.models.find(
		(model) => model.model === currentModel,
	);

	const hasOptions =
		OPTION_BEARING_TYPES.includes(node.type) && node.type !== "reference";

	return (
		<div className="space-y-5" dir="rtl">
			<div className="grid gap-4 md:grid-cols-2">
				<label className="block">
					<span className="mb-1 block text-sm font-medium">عنوان فیلد</span>
					<MyInput
						value={node.label}
						onValueChange={(value) => onPatch({ label: value })}
						placeholder="مثلاً شدت تصادف"
					/>
				</label>
				<label className="block">
					<span className="mb-1 block text-sm font-medium">نوع فیلد</span>
					<select
						className="w-full rounded-lg border border-white/10 bg-white/[.04] p-2 text-sm"
						value={node.type}
						onChange={(event) => onPatch({ type: event.target.value as FieldNode["type"] })}
					>
						{Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
				</label>
			</div>

			<label className="block">
				<span className="mb-1 block text-sm font-medium">راهنمای زیر فیلد (اختیاری)</span>
				<MyInput
					value={node.description ?? ""}
					onValueChange={(value) => onPatch({ description: value })}
					placeholder="توضیح کوتاهی که به مأمور نشان داده می‌شود"
				/>
			</label>

			<label className="block">
				<span className="mb-1 block text-sm font-medium">
					پیام خطای سفارشی (اختیاری)
				</span>
				<MyInput
					value={node.optionalHint ?? ""}
					onValueChange={(value) => onPatch({ optionalHint: value })}
					placeholder="در صورت خالی بودن، این پیام نمایش داده می‌شود"
				/>
			</label>

			{node.type === "reference" && (
				<label className="block">
					<span className="mb-1 block text-sm font-medium">مدل مرجع</span>
					<select
						className="w-full rounded-lg border border-white/10 bg-white/[.04] p-2 text-sm"
						value={node.options?.kind === "reference" ? node.options.model : ""}
						onChange={(event) =>
							onPatch({
								options: { kind: "reference", model: event.target.value },
							})
						}
					>
						{referenceModels.loading && <option value="">در حال دریافت…</option>}
						{referenceModels.models.map((model) => (
							<option key={model.model} value={model.model}>
								{REFERENCE_MODEL_LABELS[model.model] ?? model.model}
							</option>
						))}
					</select>
					{selectedModel && !selectedModel.hasRecords && (
						<span className="mt-1 block text-xs text-amber-200">
							این مدل هیچ رکوردی ندارد؛ گزینه‌ای برای نمایش وجود نخواهد داشت و
							فعال‌سازی فرم تا افزودن رکورد ممکن نیست.
						</span>
					)}
					<span className="mt-1 block text-xs text-slate-400">
						گزینه‌ها از همین مدل در سرور خوانده می‌شوند و نباید دستی وارد شوند.
					</span>
				</label>
			)}

			<BindingEditor
				node={node}
				formKind={formKind}
				definition={definition}
				onPatch={onPatch}
			/>

			<IconPicker
				value={node.icon}
				onChange={(icon) => onPatch({ icon: icon as FormIconName | undefined })}
				label="آیکون فیلد"
			/>

			{hasOptions && <OptionListEditor node={node} onPatch={onPatch} />}

			<RuleEditor
				title="شرط نمایش"
				hint="اگر این شرط برقرار نباشد، فیلد نمایش داده نمی‌شود."
				rule={node.visibleWhen}
				definition={definition}
				labels={labels}
				// A field cannot be conditioned on itself: the condition would
				// depend on an answer the officer can never make.
				excludeKey={node.key}
				onChange={(rule) => onPatch({ visibleWhen: rule })}
			/>

			<RuleEditor
				title="شرط الزام"
				hint="فیلد فقط وقتی اجباری می‌شود که این شرط برقرار باشد."
				rule={node.requiredWhen}
				definition={definition}
				labels={labels}
				excludeKey={node.key}
				onChange={(rule) => onPatch({ requiredWhen: rule })}
			/>

			{hasOptions && (
				<RuleEditor
					title="شرط نمایش گزینه‌ها"
					hint="گزینه‌های فیلد را بر اساس پاسخ فیلد دیگری محدود می‌کند."
					rule={
						node.optionsFilter?.mode === "dynamic" ? node.optionsFilter.rule : undefined
					}
					definition={definition}
					labels={labels}
					excludeKey={node.key}
					onChange={(rule) =>
						onPatch({
							optionsFilter: rule
								? {
										mode: "dynamic",
										rule,
										values: currentValues(node),
									}
								: undefined,
						})
					}
				/>
			)}

			<CascadeEditor node={node} definition={definition} onPatch={onPatch} />

			{(node.validation?.minLength !== undefined ||
				node.validation?.maxLength !== undefined ||
				node.validation?.min !== undefined ||
				node.validation?.max !== undefined) && (
				<div className="rounded-lg border border-white/10 bg-white/[.04] p-3 text-sm text-slate-300">
					<strong>محدودیت عددی فعال است.</strong>{" "}
					{node.type === "number" ? (
						<span>
							بین {node.validation?.min ?? "—"} و {node.validation?.max ?? "—"}
						</span>
					) : (
						<span>
							طول بین {node.validation?.minLength ?? "—"} و{" "}
							{node.validation?.maxLength ?? "—"} نویسه
						</span>
					)}
				</div>
			)}
		</div>
	);
}

const currentValues = (node: FieldNode): string[] =>
	node.options?.kind === "literal" ? (node.options.items ?? []).map((item) => item.value) : [];

// ---------------------------------------------------------------------------

function OptionListEditor({
	node,
	onPatch,
}: {
	node: FieldNode;
	onPatch: (patch: Partial<FieldNode>) => void;
}) {
	const items: OptionItem[] =
		node.options?.kind === "literal" ? node.options.items ?? [] : [];

	const write = (next: OptionItem[]) => {
		// With a narrowing filter in place the allowed set is the filter's value
		// list, so keep the two in sync rather than letting them drift.
		const patch: Partial<FieldNode> = { options: { kind: "literal", items: next } };
		if (node.optionsFilter?.mode === "dynamic") {
			patch.optionsFilter = { ...node.optionsFilter, values: next.map((i) => i.value) };
		}
		onPatch(patch);
	};

	return (
		<div className="rounded-lg border border-white/10 p-3">
			<div className="mb-2 flex items-center justify-between">
				<span className="text-sm font-medium">گزینه‌ها</span>
				<button
					type="button"
					className="text-sm text-emerald-200 hover:underline"
					onClick={() =>
						write([...items, { value: `گزینه ${items.length + 1}`, label: `گزینه ${items.length + 1}` }])
					}
				>
					+ افزودن گزینه
				</button>
			</div>

			{items.length === 0 ? (
				<p className="text-sm text-slate-400">
					هنوز گزینه‌ای تعریف نشده است. بدون گزینه، این فیلد گزینه‌ای برای نمایش ندارد.
				</p>
			) : (
				<ul className="space-y-2">
					{items.map((item, index) => (
						<li key={`${item.value}-${index}`} className="flex items-center gap-2">
							<MyInput
								value={item.label}
								onValueChange={(value) => {
									const next = [...items];
									next[index] = { ...item, label: value, value };
									write(next);
								}}
								placeholder="عنوان گزینه"
							/>
							<select
								className="rounded-lg border border-white/10 p-2 text-sm"
								value={item.tone ?? "normal"}
								onChange={(event) => {
									const next = [...items];
									next[index] = {
										...item,
										tone: event.target.value as OptionItem["tone"],
									};
									write(next);
								}}
							>
								<option value="normal">معمولی</option>
								<option value="warn">هشدار</option>
								<option value="danger">خطر</option>
							</select>
							<button
								type="button"
								className="text-sm text-rose-400 hover:underline"
								onClick={() => write(items.filter((_, i) => i !== index))}
							>
								حذف
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------

/**
 * Cascade clear editor.
 *
 * Changing a plate type invalidates the plate parts; changing a "damage
 * confirmed" answer invalidates the damage list. Declaring that here means the
 * officer never files a stale value that no longer means anything.
 */
function CascadeEditor({
	node,
	definition,
	onPatch,
}: {
	node: FieldNode;
	definition: Parameters<typeof allFieldKeys>[0];
	/** Decides which relations a question may bind to. */
	formKind?: FormKind;
	onPatch: (patch: Partial<FieldNode>) => void;
}) {
	const fields = allFieldKeys(definition).filter((field) => field.key !== node.key);
	const targets = node.clearOnChange ?? [];

	return (
		<div className="rounded-lg border border-white/10 p-3">
			<span className="mb-1 block text-sm font-medium">
				پاک‌سازی خودکار فیلدهای وابسته
			</span>
			<p className="mb-2 text-xs text-slate-400">
				با تغییر این فیلد، موارد انتخاب‌شده پاک می‌شوند تا مقدار بی‌معنا باقی نماند.
			</p>
			{fields.length === 0 ? (
				<p className="text-sm text-slate-400">فیلد دیگری برای انتخاب وجود ندارد.</p>
			) : (
				<ul className="max-h-40 space-y-1 overflow-y-auto">
					{fields.map((field) => {
						const checked = targets.includes(field.key);
						return (
							<li key={field.key} className="flex items-center gap-2 text-sm">
								<input
									type="checkbox"
									checked={checked}
									id={`cascade-${node.key}-${field.key}`}
									onChange={(event) => {
										const next = event.target.checked
											? [...targets, field.key]
											: targets.filter((key) => key !== field.key);
										onPatch({ clearOnChange: next });
									}}
								/>
								<label htmlFor={`cascade-${node.key}-${field.key}`}>
									{field.label}
									<span className="text-xs text-slate-500"> ({field.type})</span>
								</label>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}