/**
 * Builder-side draft types and pure helpers.
 *
 * The draft is the definition exactly as the engine reads it — no parallel
 * shape to translate — so the live preview, the client-side validation and the
 * payload sent to the backend all operate on the same object. That removes a
 * whole class of bug where the preview shows one form and the backend stores
 * another.
 */

import type {
	ContentNode,
	FieldNode,
	FieldType,
	FormDefinition,
	OptionItem,
	PageNode,
	RepeatableNode,
	Rule,
	SectionNode,
} from "@forms";
import { DEFAULT_SCHEMA_VERSION } from "@forms";

export type { ContentNode, FieldNode, FieldType, FormDefinition, Rule };

/** Persian labels for the field types the engine can render. */
export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
	text: "متن کوتاه",
	textarea: "متن بلند",
	number: "عدد",
	date: "تاریخ",
	time: "ساعت",
	datetime: "تاریخ و ساعت",
	select: "انتخاب یکی",
	multi_select: "انتخاب چندتایی",
	boolean: "بله / خیر",
	choice_group: "دکمه‌های انتخاب",
	reference: "فهرست مرجع",
	plate: "پلاک",
	file: "مستندات",
	location: "موقعیت روی نقشه",
	computed: "مقدار محاسبه‌شده",
};

/** Types that show an option list in the property editor. */
export const OPTION_BEARING_TYPES: FieldType[] = [
	"select",
	"multi_select",
	"choice_group",
	"boolean",
	"reference",
];

/**
 * The two kinds of form.
 *
 * This replaces the old `incident_type` list of four values: an organization
 * authors exactly one accident form — the backend enforces a single active one per
 * organization — and any number of report forms, each with its own title and icon.
 *
 * The kind decides which model a form's answers are written into, and therefore
 * which relations its questions may bind to.
 */
export type FormKind = "accident" | "incident_report";

export const FORM_KINDS: Array<{ value: FormKind; label: string }> = [
	{ value: "accident", label: "فرم تصادف" },
	{ value: "incident_report", label: "فرم رخداد (خرابی، مانع، سایر)" },
];

export const FORM_KIND_LABELS: Record<FormKind, string> = {
	accident: "تصادف",
	incident_report: "رخداد",
};

/**
 * Persian labels for the models a `reference` field may point at.
 *
 * The *list* of permitted models is no longer kept here: it is served by
 * `form_definition.getReferenceModels`, which reads the backend allow-list and
 * reports whether each model has records. A hand-kept list had already drifted
 * sixteen models behind it, so a builder could offer a model the backend rejects —
 * and one it hid that the backend allowed.
 *
 * `hasRecords` matters too: `activate` refuses a definition whose reference source
 * is empty, so the builder warns before an author writes an unanswerable question.
 */
export const REFERENCE_MODEL_LABELS: Record<string, string> = {
	air_status: "وضعیت هوا",
	area_usage: "کاربری منطقه",
	collision_type: "نوع برخورد",
	croquis_type: "نوع کروکی",
	damage_severity: "شدت خسارت",
	equipment_damage: "تجهیزات آسیب‌دیده",
	human_reason: "دلیل انسانی",
	incident_severity: "شدت رخداد",
	injury_status: "وضعیت مصدومیت",
	light_status: "وضعیت روشنایی",
	plaque_type: "نوع پلاک",
	plaque_usage: "کاربری پلاک",
	position: "موقعیت / خط عبور",
	road_defect: "عیب راه",
	road_repair_type: "نوع تعمیر راه",
	road_situation: "وضعیت راه",
	road_surface_condition: "سطح راه",
	ruling_type: "نوع حکم",
	shoulder_status: "وضعیت شانه",
	type: "شدت تصادف",
	vehicle_reason: "دلیل خودرو",
	vehicle_type: "نوع وسیله",
	driver_status: "وضعیت راننده",
	fault_status: "وضعیت تقصیر",
	motion_direction: "جهت حرکت",
	max_damage_section: "بیشترین بخش آسیب‌دیده",
	air_pollution_zone: "منطقه آلودگی هوا",
	province: "استان",
	city: "شهر",
	township: "بخش",
	road: "جاده",
	traffic_zone: "محدوده تردد",
	city_zone: "محدوده شهری",
	body_insurance_co: "شرکت بیمه بدنه",
	vehicle_final_status: "وضعیت نهایی خودرو",
};

export const newKey = (): string =>
	(crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).slice(0, 8);

export const emptyDefinition = (name = ""): FormDefinition => ({
	schemaVersion: DEFAULT_SCHEMA_VERSION,
	name,
	pages: [],
});

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

export const makePage = (order: number): PageNode => ({
	key: newKey(),
	title: `صفحه ${order}`,
	order,
	sections: [],
});

export const makeSection = (order: number): SectionNode => ({
	key: newKey(),
	title: `بخش ${order}`,
	order,
	nodes: [],
});

/** A field pre-filled for its type, so the builder never starts blank. */
export const makeField = (type: FieldType, order: number): FieldNode => {
	const base: FieldNode = {
		kind: "field",
		key: newKey(),
		type,
		label: FIELD_TYPE_LABELS[type],
		order,
	};

	switch (type) {
		case "select":
		case "multi_select":
		case "choice_group":
			return { ...base, options: { kind: "literal", items: [] } };
		case "boolean":
			return {
				...base,
				options: {
					kind: "literal",
					items: [
						{ value: "بله", label: "بله" },
						{ value: "خیر", label: "خیر" },
					],
				},
			};
		case "reference":
			return { ...base, options: { kind: "reference", model: "collision_type" } };
		default:
			return base;
	}
};

export const makeRepeatable = (order: number): RepeatableNode => ({
	kind: "repeatable",
	key: newKey(),
	label: "گروه تکرارشونده",
	order,
	minItems: 0,
	children: [],
});

export const makeGroup = (order: number): ContentNode => ({
	kind: "group",
	key: newKey(),
	label: "گروه",
	order,
	children: [],
});

// ---------------------------------------------------------------------------
// Immutability helpers — every edit returns a new tree
// ---------------------------------------------------------------------------

type NodeList = ContentNode[];

const mapTree = (nodes: NodeList, fn: (node: ContentNode) => ContentNode): NodeList =>
	nodes.map((node) => {
		const mapped = fn(node);
		if (mapped.kind === "group" || mapped.kind === "repeatable") {
			return { ...mapped, children: mapTree(mapped.children, fn) };
		}
		return mapped;
	});

export const updateNode = (
	definition: FormDefinition,
	key: string,
	patch: Partial<ContentNode>,
): FormDefinition => ({
	...definition,
	pages: definition.pages.map((page) => ({
		...page,
		sections: page.sections.map((section) => ({
			...section,
			nodes: mapTree(section.nodes, (node) =>
				node.key === key ? ({ ...node, ...patch } as ContentNode) : node
			),
		})),
	})),
});

export const removeNode = (
	definition: FormDefinition,
	key: string,
): FormDefinition => ({
	...definition,
	pages: definition.pages.map((page) => ({
		...page,
		sections: page.sections.map((section) => ({
			...section,
			nodes: removeFrom(section.nodes, key),
		})),
	})),
});

const removeFrom = (nodes: NodeList, key: string): NodeList =>
	nodes
		.filter((node) => node.key !== key)
		.map((node) =>
			node.kind === "group" || node.kind === "repeatable"
				? { ...node, children: removeFrom(node.children, key) }
				: node,
		);

export const addNode = (
	definition: FormDefinition,
	sectionKey: string,
	node: ContentNode,
	parentKey?: string,
): FormDefinition => ({
	...definition,
	pages: definition.pages.map((page) => ({
		...page,
		sections: page.sections.map((section) => {
			if (section.key !== sectionKey) return section;
			return {
				...section,
				nodes: parentKey
					? insertInto(section.nodes, parentKey, node)
					: [...section.nodes, node],
			};
		}),
	})),
});

/** Insert a node as the last child of a group/repeatable. */
const insertInto = (
	nodes: NodeList,
	parentKey: string,
	node: ContentNode,
): NodeList =>
	nodes.map((candidate) => {
		if (candidate.key === parentKey && candidate.kind !== "field") {
			return {
				...candidate,
				children: [...candidate.children, node],
			};
		}
		if (candidate.kind !== "field") {
			return {
				...candidate,
				children: insertInto(candidate.children, parentKey, node),
			};
		}
		return candidate;
	});

/** Move a node one slot up or down among its siblings. */
export const moveNode = (
	definition: FormDefinition,
	key: string,
	direction: -1 | 1,
): FormDefinition => ({
	...definition,
	pages: definition.pages.map((page) => ({
		...page,
		sections: page.sections.map((section) => {
			if (!section.nodes.some((node) => contains(node, key))) return section;
			return { ...section, nodes: shift(section.nodes, key, direction) };
		}),
	})),
});

const contains = (node: ContentNode, key: string): boolean =>
	node.key === key ||
	(node.kind !== "field" && node.children.some((child) => contains(child, key)));

const shift = (nodes: NodeList, key: string, direction: -1 | 1): NodeList => {
	const index = nodes.findIndex((node) => node.key === key);
	if (index !== -1) {
		const target = index + direction;
		if (target < 0 || target >= nodes.length) return nodes;
		const copy = [...nodes];
		[copy[index], copy[target]] = [copy[target], copy[index]];
		return copy;
	}
	// Not a direct sibling — descend, rebasing the direction so "up" stays "up"
	// as the user moves through nested levels.
	const inverse = direction === -1 ? 1 : -1;
	return nodes.map((node) =>
		node.kind === "field"
			? node
			: { ...node, children: shift(node.children, key, inverse) },
	);
};

export const updateSection = (
	definition: FormDefinition,
	pageKey: string,
	sectionKey: string,
	patch: Partial<SectionNode>,
): FormDefinition => ({
	...definition,
	pages: definition.pages.map((page) =>
		page.key === pageKey
			? {
					...page,
					sections: page.sections.map((section) =>
						section.key === sectionKey ? { ...section, ...patch } : section,
					),
				}
			: page,
	),
});

export const addPage = (definition: FormDefinition): FormDefinition => {
	const page = makePage(definition.pages.length + 1);
	return {
		...definition,
		pages: [...definition.pages, { ...page, sections: [makeSection(1)] }],
	};
};

export const updatePage = (
	definition: FormDefinition,
	pageKey: string,
	patch: Partial<PageNode>,
): FormDefinition => ({
	...definition,
	pages: definition.pages.map((page) =>
		page.key === pageKey ? { ...page, ...patch } : page,
	),
});

export const removePage = (
	definition: FormDefinition,
	pageKey: string,
): FormDefinition => ({
	...definition,
	pages: definition.pages.filter((page) => page.key !== pageKey),
});

export const addSection = (
	definition: FormDefinition,
	pageKey: string,
): FormDefinition => ({
	...definition,
	pages: definition.pages.map((page) =>
		page.key === pageKey
			? {
					...page,
					sections: [
						...page.sections,
						makeSection(page.sections.length + 1),
					],
				}
			: page,
	),
});

export const removeSection = (
	definition: FormDefinition,
	pageKey: string,
	sectionKey: string,
): FormDefinition => ({
	...definition,
	pages: definition.pages.map((page) =>
		page.key === pageKey
			? {
					...page,
					sections: page.sections.filter((section) => section.key !== sectionKey),
				}
			: page,
	),
});

// ---------------------------------------------------------------------------
// Inspection — what the builder needs to know about the tree
// ---------------------------------------------------------------------------

/** Every field key in the definition, for the rule editor's field picker. */
export const allFieldKeys = (
	definition: FormDefinition,
): Array<{ key: string; label: string; type: FieldType; path: string }> => {
	const out: Array<{ key: string; label: string; type: FieldType; path: string }> = [];

	const visit = (nodes: ContentNode[], prefix: string) => {
		for (const node of nodes) {
			const path = prefix ? `${prefix}.${node.key}` : node.key;
			if (node.kind === "field") {
				out.push({ key: node.key, label: node.label, type: node.type, path });
				continue;
			}
			if (node.kind === "repeatable") {
				out.push({
					key: node.key,
					label: node.label,
					type: "multi_select",
					path: `${path}[]`,
				});
			}
			visit(node.children, node.kind === "repeatable" ? `${path}[]` : path);
		}
	};

	for (const page of definition.pages) {
		for (const section of page.sections) visit(section.nodes, "");
	}
	return out;
};

export const findNodeIn = (
	definition: FormDefinition,
	key: string,
): ContentNode | undefined => {
	for (const page of definition.pages) {
		for (const section of page.sections) {
			const found = search(section.nodes, key);
			if (found) return found;
		}
	}
	return undefined;
};

const search = (nodes: ContentNode[], key: string): ContentNode | undefined => {
	for (const node of nodes) {
		if (node.key === key) return node;
		if (node.kind !== "field") {
			const found = search(node.children, key);
			if (found) return found;
		}
	}
	return undefined;
};

/** Literal option items of a field, or `[]` for non-option types. */
export const literalOptions = (node: ContentNode): OptionItem[] =>
	node.kind === "field" && node.options?.kind === "literal"
		? node.options.items ?? []
		: [];

export const setLiteralOptions = (
	node: ContentNode,
	items: OptionItem[],
): Partial<FieldNode> => ({
	options: { kind: "literal", items },
});