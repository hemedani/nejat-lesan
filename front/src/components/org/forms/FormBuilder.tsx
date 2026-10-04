"use client";

/**
 * Form builder.
 *
 * An org admin composes a field report here: pages, sections, fields, nested
 * repeatable groups, and the conditional logic that makes the form adapt to
 * what an officer actually reports. Saving replaces the stored definition
 * wholesale, matching the backend's `update`.
 *
 * Two panels: the tree on the right (RTL) and a live preview on the left. The
 * preview runs the real shared engine, so it cannot drift from what an officer
 * will see in the field.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { ContentNode, FieldNode, FormDefinition, FormIconName } from "@forms";
import { getFormDefinition } from "@/app/actions/form_definition/get";
import { addFormDefinition } from "@/app/actions/form_definition/add";
import { updateFormDefinition } from "@/app/actions/form_definition/update";
import { activateFormDefinition } from "@/app/actions/form_definition/activate";
import { duplicateFormDefinition } from "@/app/actions/form_definition/duplicate";
import { archiveFormDefinition } from "@/app/actions/form_definition/archive";
import {
	asSingleItemResponse,
	getPatrolErrorMessage,
	unwrapApiResponse,
} from "@/utils/api-response";
import { Button } from "@/components/atoms/Button";
import { IconPicker } from "./IconPicker";
import MyInput from "@/components/atoms/MyInput";
import { PageSkeleton, RetryErrorBox } from "@/components/patrol/ui";
import { NodeTree } from "./NodeTree";
import { FieldEditor } from "./FieldEditor";
import { LivePreview } from "./LivePreview";
import {
	FORM_KINDS,
	type FormKind,
	addNode,
	addPage,
	addSection,
	emptyDefinition,
	findNodeIn,
	makeField,
	makeGroup,
	makeRepeatable,
	moveNode,
	removeNode,
	removePage,
	removeSection,
	updateNode,
	updatePage,
	updateSection,
} from "./form-types";

interface FormRecord {
	_id: string;
	name: string;
	description?: string;
	status?: string;
	version?: number;
	form_kind?: FormKind;
	icon?: FormIconName;
	definition?: FormDefinition;
}

export function FormBuilder({
	orgId,
	formId,
}: {
	orgId: string;
	formId?: string;
}) {
	const router = useRouter();
	const [loading, setLoading] = useState(Boolean(formId));
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [status, setStatus] = useState<string | undefined>();
	const [version, setVersion] = useState<number | undefined>();
	const [selectedKey, setSelectedKey] = useState<string | undefined>();
	const [tab, setTab] = useState<"build" | "preview">("build");

	const [meta, setMeta] = useState({
		name: "",
		description: "",
		// Two kinds, not four incident types: an accident form writes into
		// `accident`, a report form into `incident_report`.
		form_kind: "accident" as FormKind,
		icon: undefined as FormIconName | undefined,
	});
	const [definition, setDefinition] = useState<FormDefinition>(() =>
		emptyDefinition(),
	);

	const load = useCallback(async () => {
		if (!formId) return;
		setLoading(true);
		setError(null);
		try {
			const first = unwrapApiResponse<FormRecord | null>(
				asSingleItemResponse(
					await getFormDefinition({ set: { _id: formId } }),
				),
			);
			if (!first) {
				setError("فرم یافت نشد");
				return;
			}
			setMeta({
				name: first.name ?? "",
				description: first.description ?? "",
				form_kind: first.form_kind ?? "accident",
				icon: first.icon,
			});
			// A stored definition may predate a field the engine now knows, so it
			// is normalised rather than trusted verbatim.
			setDefinition(normalize(first.definition));
			setStatus(first.status);
			setVersion(first.version);
		} catch (cause) {
			setError(getPatrolErrorMessage(cause) || "بارگذاری فرم ناموفق بود");
		} finally {
			setLoading(false);
		}
	}, [formId]);

	useEffect(() => {
		void load();
	}, [load]);

	const selected = useMemo(
		() => (selectedKey ? findNodeIn(definition, selectedKey) : undefined),
		[definition, selectedKey],
	);

	// A node that vanished (undo, page delete) must not stay selected.
	useEffect(() => {
		if (selectedKey && !selected) setSelectedKey(undefined);
	}, [selectedKey, selected]);

	const patchNode = (patch: Partial<ContentNode>) => {
		if (!selectedKey) return;
		setDefinition((current) => updateNode(current, selectedKey, patch));
	};

	const save = async (): Promise<string | undefined> => {
		setSaving(true);
		try {
			const payload = {
				name: meta.name || "فرم بدون عنوان",
				description: meta.description || undefined,
				form_kind: meta.form_kind,
				icon: meta.icon,
				definition: { ...definition, name: meta.name },
			};

			const response = formId
				? await updateFormDefinition({ set: { _id: formId, ...payload } })
				: await addFormDefinition({
						set: { organizationId: orgId, ...payload },
					});

			const saved = unwrapApiResponse<FormRecord | null>(
				asSingleItemResponse(response),
			);
			if (!saved?._id) {
				toast.error("ذخیره فرم ناموفق بود");
				return undefined;
			}
			toast.success("فرم ذخیره شد");
			if (!formId) {
				router.push(`/forms/${saved._id}`);
			} else {
				setStatus(saved.status);
				setVersion(saved.version);
			}
			return saved._id;
		} catch (cause) {
			toast.error(getPatrolErrorMessage(cause) || "ذخیره فرم ناموفق بود");
			return undefined;
		} finally {
			setSaving(false);
		}
	};

	const activate = async () => {
		if (!formId) {
			toast.error("ابتدا فرم را ذخیره کنید");
			return;
		}
		setSaving(true);
		try {
			// Always save first, and await it: activating a stale draft would
			// publish questions the admin has already changed.
			const savedId = await save();
			if (!savedId) return;

			const result = unwrapApiResponse<{
				version?: number;
				message?: string;
			}>(await activateFormDefinition({ set: { _id: savedId } }));
			toast.success(result.message ?? "فرم فعال شد");
			setStatus("active");
			if (typeof result.version === "number") setVersion(result.version);
		} catch (cause) {
			toast.error(getPatrolErrorMessage(cause) || "فعال‌سازی فرم ناموفق بود");
		} finally {
			setSaving(false);
		}
	};

	const archive = async () => {
		if (!formId) return;
		setSaving(true);
		try {
			await archiveFormDefinition({ set: { _id: formId } });
			toast.success("فرم غیرفعال شد");
			setStatus("archived");
		} catch (cause) {
			toast.error(getPatrolErrorMessage(cause) || "غیرفعال‌سازی فرم ناموفق بود");
		} finally {
			setSaving(false);
		}
	};

	const duplicate = async () => {
		if (!formId) return;
		setSaving(true);
		try {
			const clone = unwrapApiResponse<FormRecord | null>(
				asSingleItemResponse(
					await duplicateFormDefinition({ set: { _id: formId } }),
				),
			);
			toast.success("کپی ساخته شد");
			if (clone?._id) router.push(`/forms/${clone._id}`);
		} catch (cause) {
			toast.error(getPatrolErrorMessage(cause) || "ساخت کپی ناموفق بود");
		} finally {
			setSaving(false);
		}
	};

	if (loading) return <PageSkeleton blocks={[72, 220, 260, 200]} />;
	if (error) return <RetryErrorBox message={error} onRetry={() => void load()} />;

	const readOnly = status === "active";

	return (
		<div className="space-y-4" dir="rtl">
			<header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/75 p-3">
				<div className="min-w-64 flex-1 space-y-2">
					<input
						className="w-full rounded-lg border border-white/10 p-2 text-base font-medium"
						value={meta.name}
						onChange={(event) => setMeta({ ...meta, name: event.target.value })}
						placeholder="نام فرم"
						disabled={readOnly}
					/>
					<div className="flex flex-wrap gap-2">
						<select
							className="rounded-lg border border-white/10 p-2 text-sm"
							value={meta.form_kind}
							onChange={(event) =>
								setMeta({
									...meta,
									form_kind: event.target.value as FormKind,
								})
							}
							disabled={readOnly}
						>
							{FORM_KINDS.map((kind) => (
								<option key={kind.value} value={kind.value}>
									{kind.label}
								</option>
							))}
						</select>
						{!readOnly && (
							<IconPicker
								value={meta.icon}
								onChange={(icon) => setMeta({ ...meta, icon })}
								label="آیکون فرم"
							/>
						)}
						<span className="self-center text-xs text-slate-400">
							{status === "active"
								? `فعال — نسخه ${version ?? "—"}`
								: status === "archived"
								? "بایگانی‌شده"
								: "پیش‌نویس"}
						</span>
					</div>
				</div>

				<div className="flex flex-wrap gap-2">
					<Button onClick={() => setTab(tab === "build" ? "preview" : "build")}>
						{tab === "build" ? "پیش‌نمایش" : "بازگشت به ساخت"}
					</Button>
					<Button onClick={duplicate} loading={saving} disabled={!formId}>
						کپی
					</Button>
					{status === "active" && (
						<Button
							onClick={archive}
							loading={saving}
							disabled={!formId}
							variant="danger"
						>
							غیرفعال‌سازی
						</Button>
					)}
					{!readOnly && (
						<Button onClick={save} loading={saving} variant="secondary">
							ذخیره
						</Button>
					)}
					{!readOnly && (
						<Button onClick={activate} loading={saving} variant="primary">
							فعال‌سازی
						</Button>
					)}
				</div>
			</header>

			{readOnly && (
				<div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100">
					این فرم فعال است و قابل ویرایش نیست. برای تغییر، ابتدا آن را بایگانی کنید یا
					یک کپی بسازید.
				</div>
			)}

			{tab === "build" ? (
				<div className="grid gap-4 lg:grid-cols-2">
					<div className="space-y-4">
						<NodeTree
							definition={definition}
							selectedKey={selectedKey}
							onSelect={setSelectedKey}
							onAddField={(sectionKey, type, parentKey) =>
								setDefinition((current) =>
									addNode(current, sectionKey, makeField(type, 0), parentKey),
								)
							}
							onAddRepeatable={(sectionKey, parentKey) =>
								setDefinition((current) =>
									addNode(current, sectionKey, makeRepeatable(0), parentKey),
								)
							}
							onAddGroup={(sectionKey, parentKey) =>
								setDefinition((current) =>
									addNode(current, sectionKey, makeGroup(0), parentKey),
								)
							}
							onMove={(key, direction) =>
								setDefinition((current) => moveNode(current, key, direction))
							}
							onRemove={(key) =>
								setDefinition((current) => removeNode(current, key))
							}
							onAddPage={() => setDefinition((current) => addPage(current))}
							onUpdatePage={(key, patch) =>
								setDefinition((current) => updatePage(current, key, patch))
							}
							onRemovePage={(key) =>
								setDefinition((current) => removePage(current, key))
							}
							onAddSection={(pageKey) =>
								setDefinition((current) => addSection(current, pageKey))
							}
							onUpdateSection={(pageKey, key, patch) =>
								setDefinition((current) =>
									updateSection(current, pageKey, key, patch),
								)
							}
							onRemoveSection={(pageKey, key) =>
								setDefinition((current) =>
									removeSection(current, pageKey, key),
								)
							}
						/>
					</div>

					<div className="space-y-4">
						{selected ? (
							<div className="rounded-xl border border-white/10 bg-slate-900/75 p-4">
								<h3 className="mb-3 text-sm font-semibold">
									تنظیمات «{selected.label ?? selected.key}»
								</h3>
								{selected.kind === "field" ? (
									<FieldEditor
										node={selected as FieldNode}
										definition={definition}
										formKind={meta.form_kind}
										onPatch={patchNode}
									/>
								) : (
									<ContainerEditor
										node={selected}
										onPatch={patchNode}
									/>
								)}
							</div>
						) : (
							<div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
								برای ویرایش، یک فیلد یا گروه را از درخت انتخاب کنید.
							</div>
						)}
					</div>
				</div>
			) : (
				<LivePreview definition={definition} />
			)}
		</div>
	);
}

/** Property editor for a group or repeatable container. */
function ContainerEditor({
	node,
	onPatch,
}: {
	node: ContentNode;
	onPatch: (patch: Partial<ContentNode>) => void;
}) {
	if (node.kind === "field") return null;
	return (
		<div className="space-y-4">
			<label className="block">
				<span className="mb-1 block text-sm font-medium">عنوان گروه</span>
				<MyInput
					value={node.label ?? ""}
					onValueChange={(value) => onPatch({ label: value })}
				/>
			</label>

			{node.kind === "repeatable" && (
				<div className="grid gap-3 md:grid-cols-3">
					<label className="block">
						<span className="mb-1 block text-sm font-medium">حداقل تعداد</span>
						<input
							type="number"
							className="w-full rounded-lg border border-white/10 p-2 text-sm"
							value={node.minItems ?? 0}
							onChange={(event) =>
								onPatch({ minItems: Number(event.target.value) || 0 })
							}
						/>
					</label>
					<label className="block">
						<span className="mb-1 block text-sm font-medium">حداکثر تعداد</span>
						<input
							type="number"
							className="w-full rounded-lg border border-white/10 p-2 text-sm"
							value={node.maxItems ?? ""}
							placeholder="بدون محدودیت"
							onChange={(event) =>
								onPatch({
									maxItems: event.target.value
										? Number(event.target.value)
										: undefined,
								})
							}
						/>
					</label>
					<label className="block">
						<span className="mb-1 block text-sm font-medium">عنوان هر ردیف</span>
						<MyInput
							value={node.itemLabel ?? ""}
							onValueChange={(value) => onPatch({ itemLabel: value })}
							placeholder="مثلاً وسیله"
						/>
					</label>
				</div>
			)}

			<p className="text-xs text-slate-400">
				{node.kind === "repeatable"
					? "فیلدهای داخل این گروه برای هر ردیف جداگانه پر می‌شوند و می‌توانند شامل گروه تکرارشونده دیگری باشند."
					: "گروه فقط برای دسته‌بندی فیلدها استفاده می‌شود."}
			</p>
		</div>
	);
}

/**
 * Coerce a stored definition into the current engine shape.
 *
 * A definition saved by an older build may lack `pages` or carry a page with no
 * sections; the builder would then crash on the first render. Normalising here
 * keeps that a display concern rather than a runtime failure.
 */
const normalize = (definition?: FormDefinition): FormDefinition => {
	if (!definition || !Array.isArray(definition.pages)) return emptyDefinition();
	return {
		schemaVersion: definition.schemaVersion ?? 1,
		name: definition.name ?? "",
		pages: definition.pages
			.filter((page) => page && typeof page.key === "string")
			.map((page, index) => ({
				...page,
				order: page.order ?? index + 1,
				title: page.title ?? `صفحه ${index + 1}`,
				sections: Array.isArray(page.sections) ? page.sections : [],
			})),
	};
};