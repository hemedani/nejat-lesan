"use client";

/**
 * Definition tree with the field palette.
 *
 * Reordering uses ↑/↓ buttons rather than drag-and-drop: `front/AGENTS.md` lists
 * no drag library, `ProcessBuilder` already established arrow-button reordering,
 * and adding `@dnd-kit` for one screen would be unjustified complexity.
 */

import { useState } from "react";
import type {
	ContentNode,
	FieldType,
	FormDefinition,
	PageNode,
	SectionNode,
} from "@forms";
import { FIELD_TYPE_LABELS } from "./form-types";
import { describeRule } from "./rule-editor";

export function NodeTree({
	definition,
	selectedKey,
	onSelect,
	onAddField,
	onAddRepeatable,
	onAddGroup,
	onMove,
	onRemove,
	onAddPage,
	onUpdatePage,
	onRemovePage,
	onAddSection,
	onUpdateSection,
	onRemoveSection,
}: {
	definition: FormDefinition;
	selectedKey?: string;
	onSelect: (key: string) => void;
	onAddField: (sectionKey: string, type: FieldType, parentKey?: string) => void;
	onAddRepeatable: (sectionKey: string, parentKey?: string) => void;
	onAddGroup: (sectionKey: string, parentKey?: string) => void;
	onMove: (key: string, direction: -1 | 1) => void;
	onRemove: (key: string) => void;
	onAddPage: () => void;
	onUpdatePage: (key: string, patch: Partial<PageNode>) => void;
	onRemovePage: (key: string) => void;
	onAddSection: (pageKey: string) => void;
	onUpdateSection: (pageKey: string, key: string, patch: Partial<SectionNode>) => void;
	onRemoveSection: (pageKey: string, key: string) => void;
}) {
	return (
		<div className="space-y-4" dir="rtl">
			{definition.pages.length === 0 && (
				<div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
					هنوز صفحه‌ای ساخته نشده است. با «افزودن صفحه» شروع کنید.
				</div>
			)}

			{definition.pages.map((page, pageIndex) => (
				<PageBlock
					key={page.key}
					page={page}
					index={pageIndex}
					total={definition.pages.length}
					definition={definition}
					selectedKey={selectedKey}
					onSelect={onSelect}
					onAddField={onAddField}
					onAddRepeatable={onAddRepeatable}
					onAddGroup={onAddGroup}
					onMove={onMove}
					onRemove={onRemove}
					onUpdatePage={onUpdatePage}
					onRemovePage={onRemovePage}
					onAddSection={onAddSection}
					onUpdateSection={onUpdateSection}
					onRemoveSection={onRemoveSection}
				/>
			))}

			<button
				type="button"
				className="w-full rounded-lg border border-dashed border-teal-500 py-2 text-sm text-teal-700 hover:bg-teal-50"
				onClick={onAddPage}
			>
				+ افزودن صفحه
			</button>
		</div>
	);
}

function PageBlock({
	page,
	index,
	total,
	definition,
	selectedKey,
	onSelect,
	onAddField,
	onAddRepeatable,
	onAddGroup,
	onMove,
	onRemove,
	onUpdatePage,
	onRemovePage,
	onAddSection,
	onUpdateSection,
	onRemoveSection,
}: {
	page: PageNode;
	index: number;
	total: number;
	definition: FormDefinition;
	selectedKey?: string;
	onSelect: (key: string) => void;
	onAddField: (sectionKey: string, type: FieldType, parentKey?: string) => void;
	onAddRepeatable: (sectionKey: string, parentKey?: string) => void;
	onAddGroup: (sectionKey: string, parentKey?: string) => void;
	onMove: (key: string, direction: -1 | 1) => void;
	onRemove: (key: string) => void;
	onUpdatePage: (key: string, patch: Partial<PageNode>) => void;
	onRemovePage: (key: string) => void;
	onAddSection: (pageKey: string) => void;
	onUpdateSection: (pageKey: string, key: string, patch: Partial<SectionNode>) => void;
	onRemoveSection: (pageKey: string, key: string) => void;
}) {
	const labels = new Map(
		(definition.pages ?? []).flatMap((candidate) =>
			candidate.sections.flatMap((section) =>
				section.nodes.flatMap((node) => [[node.key, node.kind === "field" ? node.label : node.label ?? node.key]] as Array<[string, string]>),
			),
		),
	);

	return (
		<div className="rounded-xl border border-gray-200 bg-white">
			<div className="flex items-center justify-between border-b border-gray-100 p-3">
				<input
					className="flex-1 rounded-lg border border-gray-300 p-2 text-sm font-medium"
					value={page.title}
					onChange={(event) => onUpdatePage(page.key, { title: event.target.value })}
					placeholder="عنوان صفحه"
				/>
				<div className="flex gap-1">
					<IconButton
						label="بالا"
						disabled={index === 0}
						onClick={() => onMove(page.key, -1)}
					/>
					<IconButton
						label="پایین"
						disabled={index === total - 1}
						onClick={() => onMove(page.key, 1)}
					/>
					<IconButton
						label="حذف صفحه"
						onClick={() => onRemovePage(page.key)}
						danger
					/>
				</div>
			</div>

			{page.visibleWhen && (
				<div className="border-b border-gray-100 bg-amber-50 px-3 py-2 text-xs text-amber-900">
					نمایش این صفحه: {describeRule(page.visibleWhen, labels)}
				</div>
			)}

			<div className="space-y-3 p-3">
				{page.sections.map((section) => (
					<SectionBlock
						key={section.key}
						section={section}
						definition={definition}
						selectedKey={selectedKey}
						onSelect={onSelect}
						onAddField={onAddField}
						onAddRepeatable={onAddRepeatable}
						onAddGroup={onAddGroup}
						onMove={onMove}
						onRemove={onRemove}
						onUpdateSection={(key, patch) => onUpdateSection(page.key, key, patch)}
						onRemoveSection={(key) => onRemoveSection(page.key, key)}
					/>
				))}
				<button
					type="button"
					className="w-full rounded-lg border border-dashed border-gray-300 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
					onClick={() => onAddSection(page.key)}
				>
					+ افزودن بخش
				</button>
			</div>
		</div>
	);
}

function SectionBlock({
	section,
	definition,
	selectedKey,
	onSelect,
	onAddField,
	onAddRepeatable,
	onAddGroup,
	onMove,
	onRemove,
	onUpdateSection,
	onRemoveSection,
}: {
	section: SectionNode;
	definition: FormDefinition;
	selectedKey?: string;
	onSelect: (key: string) => void;
	onAddField: (sectionKey: string, type: FieldType, parentKey?: string) => void;
	onAddRepeatable: (sectionKey: string, parentKey?: string) => void;
	onAddGroup: (sectionKey: string, parentKey?: string) => void;
	onMove: (key: string, direction: -1 | 1) => void;
	onRemove: (key: string) => void;
	onUpdateSection: (key: string, patch: Partial<SectionNode>) => void;
	onRemoveSection: (key: string) => void;
}) {
	return (
		<div className="rounded-lg border border-gray-200 bg-gray-50 p-2">
			<div className="mb-2 flex items-center justify-between">
				<input
					className="flex-1 rounded-lg border border-gray-300 p-1.5 text-sm"
					value={section.title}
					onChange={(event) => onUpdateSection(section.key, { title: event.target.value })}
					placeholder="عنوان بخش"
				/>
				<IconButton label="حذف بخش" onClick={() => onRemoveSection(section.key)} danger />
			</div>

			<div className="space-y-1.5">
				{section.nodes.length === 0 && (
					<p className="py-2 text-center text-xs text-gray-500">
						بخش خالی است. از دکمه‌های پایین فیلد اضافه کنید.
					</p>
				)}
				{section.nodes.map((node) => (
					<NodeRow
						key={node.key}
						node={node}
						sectionKey={section.key}
						definition={definition}
						selectedKey={selectedKey}
						onSelect={onSelect}
						onAddField={onAddField}
						onAddRepeatable={onAddRepeatable}
						onAddGroup={onAddGroup}
						onMove={onMove}
						onRemove={onRemove}
					/>
				))}
			</div>

			<FieldPalette
				onAddField={(type) => onAddField(section.key, type)}
				onAddRepeatable={() => onAddRepeatable(section.key)}
				onAddGroup={() => onAddGroup(section.key)}
			/>
		</div>
	);
}

function NodeRow({
	node,
	sectionKey,
	definition,
	selectedKey,
	onSelect,
	onAddField,
	onAddRepeatable,
	onAddGroup,
	onMove,
	onRemove,
}: {
	node: ContentNode;
	sectionKey: string;
	definition: FormDefinition;
	selectedKey?: string;
	onSelect: (key: string) => void;
	onAddField: (sectionKey: string, type: FieldType, parentKey?: string) => void;
	onAddRepeatable: (sectionKey: string, parentKey?: string) => void;
	onAddGroup: (sectionKey: string, parentKey?: string) => void;
	onMove: (key: string, direction: -1 | 1) => void;
	onRemove: (key: string) => void;
}) {
	const selected = selectedKey === node.key;
	const badges: string[] = [];

	if (node.visibleWhen) badges.push("شرط نمایش");
	if (node.requiredWhen) badges.push("شرط الزام");
	if (node.kind === "field" && node.optionsFilter?.mode === "dynamic") badges.push("گزینه پویا");
	if (node.kind === "field" && (node.clearOnChange?.length ?? 0) > 0) badges.push("پاک‌سازی وابسته");
	if (node.kind === "field" && (node.validation?.warnings?.length ?? 0) > 0) {
		badges.push(`${node.validation?.warnings?.length} هشدار`);
	}

	return (
		<div
			className={[
				"rounded-lg border bg-white p-2",
				selected ? "border-teal-600 ring-1 ring-teal-200" : "border-gray-200",
			].join(" ")}
		>
			<div className="flex items-center justify-between gap-2">
				<button
					type="button"
					className="flex flex-1 items-center gap-2 text-right text-sm"
					onClick={() => onSelect(node.key)}
				>
					<span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
						{node.kind === "field"
							? FIELD_TYPE_LABELS[node.type]
							: node.kind === "repeatable"
							? "گروه تکرارشونده"
							: "گروه"}
					</span>
					<span className="font-medium">{node.label ?? node.key}</span>
				</button>
				<div className="flex gap-1">
					<IconButton label="بالا" onClick={() => onMove(node.key, -1)} />
					<IconButton label="پایین" onClick={() => onMove(node.key, 1)} />
					<IconButton label="حذف" onClick={() => onRemove(node.key)} danger />
				</div>
			</div>

			{badges.length > 0 && (
				<div className="mt-1.5 flex flex-wrap gap-1">
					{badges.map((badge) => (
						<span
							key={badge}
							className="rounded bg-teal-50 px-1.5 py-0.5 text-[10px] text-teal-700"
						>
							{badge}
						</span>
					))}
				</div>
			)}

			{node.kind !== "field" && node.children.length > 0 && (
				<div className="mt-2 space-y-1.5 border-r-2 border-gray-100 pr-2">
					{node.children.map((child) => (
						<NodeRow
							key={child.key}
							node={child}
							sectionKey={sectionKey}
							definition={definition}
							selectedKey={selectedKey}
							onSelect={onSelect}
							onAddField={onAddField}
							onAddRepeatable={onAddRepeatable}
							onAddGroup={onAddGroup}
							onMove={onMove}
							onRemove={onRemove}
						/>
					))}
				</div>
			)}

			{node.kind !== "field" && (
				<div className="mt-2 flex gap-2">
					<select
						className="rounded-lg border border-gray-300 p-1 text-xs"
						defaultValue=""
						onChange={(event) => {
							if (event.target.value) {
								onAddField(
									sectionKey,
									event.target.value as FieldType,
									node.key,
								);
							}
							event.target.value = "";
						}}
					>
						<option value="">+ فیلد</option>
						{Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
					<button
						type="button"
						className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
						onClick={() => onAddRepeatable(sectionKey, node.key)}
					>
						+ گروه تکرارشونده
					</button>
				</div>
			)}
		</div>
	);
}

function FieldPalette({
	onAddField,
	onAddRepeatable,
	onAddGroup,
}: {
	onAddField: (type: FieldType) => void;
	onAddRepeatable: () => void;
	onAddGroup: () => void;
}) {
	const [open, setOpen] = useState(false);
	return (
		<div className="mt-2 rounded-lg border border-dashed border-gray-300 p-2">
			<button
				type="button"
				className="w-full text-xs text-gray-600"
				onClick={() => setOpen((value) => !value)}
			>
				{open ? "بستن افزودن" : "+ افزودن فیلد یا گروه"}
			</button>
			{open && (
				<div className="mt-2">
					<div className="flex flex-wrap gap-1">
						{Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
							<button
								key={value}
								type="button"
								className="rounded-lg border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
								onClick={() => onAddField(value as FieldType)}
							>
								{label}
							</button>
						))}
					</div>
					<div className="mt-2 flex gap-2">
						<button
							type="button"
							className="rounded-lg border border-teal-300 px-2 py-1 text-xs text-teal-700 hover:bg-teal-50"
							onClick={onAddRepeatable}
						>
							+ گروه تکرارشونده
						</button>
						<button
							type="button"
							className="rounded-lg border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
							onClick={onAddGroup}
						>
							+ گروه ساده
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

function IconButton({
	label,
	onClick,
	danger,
	disabled,
}: {
	label: string;
	onClick: () => void;
	danger?: boolean;
	disabled?: boolean;
}) {
	return (
		<button
			type="button"
			aria-label={label}
			title={label}
			disabled={disabled}
			onClick={onClick}
			className={[
				"rounded px-1.5 py-1 text-xs disabled:opacity-30",
				danger ? "text-red-600 hover:bg-red-50" : "text-gray-500 hover:bg-gray-100",
			].join(" ")}
		>
			{label}
		</button>
	);
}
