import { ObjectId } from "@deps";
import { getSchemas, unit } from "../../mod.ts";
import { type FieldNode, type FormDefinition, validateIconNames } from "@forms";
import { FORM_KIND_TARGET_MODEL } from "@model";
import { getAllowedManagerOrgIds, throwError } from "@lib";

/**
 * Resolve the patrol officer's organization id via `unit.organization`, used by
 * `getForPatrol` which takes no organization parameter of its own.
 */
export const resolveUserOrgId = async (
	userId: ObjectId,
): Promise<string | null> => {
	const u = await unit.findOne({
		filters: { "officers._id": userId },
		projection: { "organization._id": 1 },
	});
	const orgId = (u as unknown as { organization?: { _id?: ObjectId } })
		?.organization?._id as ObjectId | undefined;
	return orgId ? orgId.toString() : null;
};

/** The subset of the actor needed to resolve read scope. */
type ReadActor = {
	_id: unknown;
	level?: string;
	roles?: Array<{
		roleId?: string;
		name?: string;
		scopeType?: string;
		scopeId?: string;
	}>;
};

/**
 * Resolve the organization a read must be scoped to.
 *
 * Returns `null` for Ghost/Manager, who may read across organizations. Everyone
 * else is pinned to the organizations they actually belong to, so a patrol
 * officer cannot list or read another organization's forms — forms can contain an
 * org's own internal reporting structure.
 *
 * Throws with a Persian message when the caller asks for an organization outside
 * their scope, or when a multi-org caller fails to say which one.
 */
export const resolveReadOrgId = async (
	actor: ReadActor,
	requested?: string,
): Promise<string | null> => {
	const allowed = await getAllowedManagerOrgIds(actor as never);
	if (allowed === null) return requested ?? null;

	if (requested) {
		if (!allowed.includes(requested)) {
			return throwError("شما به این سازمان دسترسی ندارید");
		}
		return requested;
	}

	if (allowed.length === 1) return allowed[0];
	if (allowed.length === 0) {
		return throwError("شما به سازمانی دسترسی ندارید");
	}
	return throwError("شناسه سازمان را مشخص کنید");
};

/**
 * Build the `organization._id` filter for a read, or an empty object for a
 * global manager.
 */
export const orgFilterFor = async (
	actor: ReadActor,
	requested?: string,
): Promise<Record<string, unknown>> => {
	const orgId = await resolveReadOrgId(actor, requested);
	return orgId ? { "organization._id": new ObjectId(orgId) } : {};
};

// ---------------------------------------------------------------------------
// Definition validation
// ---------------------------------------------------------------------------

/** A `reference` field's answer can only be stored if the model exists and has records. */
export const REFERENCE_MODEL_NAMES = [
	"accident_process",
	"air_status",
	"air_pollution_zone",
	"area_usage",
	"body_insurance_co",
	"city",
	"city_zone",
	"collision_type",
	"croquis_type",
	"damage_severity",
	"driver_status",
	"equipment_damage",
	"fault_status",
	"human_reason",
	"incident_severity",
	"injury_status",
	"light_status",
	"max_damage_section",
	"motion_direction",
	"plaque_type",
	"plaque_usage",
	"position",
	"province",
	"road",
	"road_defect",
	"road_repair_type",
	"road_situation",
	"road_surface_condition",
	"ruling_type",
	"shoulder_status",
	"township",
	"traffic_zone",
	"type",
	"vehicle_final_status",
	"vehicle_reason",
	"vehicle_type",
] as const;

/** Rule ops the shared engine understands. Anything else silently evaluates false. */
const KNOWN_RULE_OPS = new Set([
	"always",
	"and",
	"or",
	"not",
	"eq",
	"ne",
	"in",
	"nin",
	"contains",
	"gt",
	"gte",
	"lt",
	"lte",
	"exists",
	"empty",
	"filled",
	"anyIn",
	"everyIn",
	"someTrue",
	"someFalse",
	"count",
]);

/** Comparison ops that must carry a `path`. */
const PATH_OPS = new Set([
	"eq",
	"ne",
	"in",
	"nin",
	"contains",
	"gt",
	"gte",
	"lt",
	"lte",
	"exists",
	"empty",
	"filled",
	"anyIn",
	"everyIn",
	"someTrue",
	"someFalse",
	"count",
]);

/**
 * Look up a reference model by name.
 *
 * Lesan exposes every model as a top-level export of `back/mod.ts`
 * (`collision_type`), *not* under `coreApp.odm` — which only carries the raw
 * `newModel`/`getCollection` primitives. So the lookup goes through the module
 * namespace rather than a property path on `coreApp`.
 */
export const getReferenceModel = (
	models: Record<string, unknown>,
	model: string,
): ModelLike | undefined => {
	const candidate = models[model];
	return isModelLike(candidate) ? candidate : undefined;
};

type ModelLike = {
	countDocument: (
		input: { filter: Record<string, unknown> },
	) => Promise<number>;
	find: (input: {
		filters: Record<string, unknown>;
		projection: Record<string, unknown>;
	}) => {
		sort: (spec: Record<string, number>) => {
			limit: (n: number) => { toArray: () => Promise<unknown[]> };
		};
	};
};

const isModelLike = (candidate: unknown): candidate is ModelLike =>
	typeof candidate === "object" && candidate !== null &&
	typeof (candidate as { countDocument?: unknown }).countDocument ===
		"function" &&
	typeof (candidate as { find?: unknown }).find === "function";

type Collect = { keys: Set<string>; errors: string[] };

const walkNodes = (
	nodes: unknown[] | undefined,
	state: Collect,
	parentPath: string,
): void => {
	if (!Array.isArray(nodes)) return;
	for (const raw of nodes) {
		if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
			continue;
		}
		const node = raw as Record<string, unknown>;
		const key = typeof node.key === "string" ? node.key : "";
		if (!key) {
			state.errors.push(`گره بدون کلید در «${parentPath}» یافت شد.`);
			continue;
		}
		const nodePath = parentPath ? `${parentPath}.${key}` : key;

		if (state.keys.has(key)) {
			state.errors.push(
				`کلید «${key}» بیش از یک بار استفاده شده است؛ کلیدها باید یکتا باشند.`,
			);
		}
		state.keys.add(key);

		validateRule(node.visibleWhen, state, key, "نمایش");
		validateRule(node.requiredWhen, state, key, "الزام");
		validateRule(node.valueFrom, state, key, "مقدار محاسبه‌شده");
		validateBindingSource(node as FieldNode, state, key);

		const filter = node.optionsFilter as
			| Record<string, unknown>
			| undefined;
		if (filter && typeof filter === "object") {
			validateRule(filter.rule, state, key, "فیلتر گزینه‌ها");
		}

		const validation = node.validation as
			| Record<string, unknown>
			| undefined;
		const warnings = validation?.warnings;
		if (Array.isArray(warnings)) {
			for (const warning of warnings) {
				const rule = (warning as Record<string, unknown>)?.rule;
				validateRule(rule, state, key, "هشدار");
			}
		}

		if (Array.isArray(node.children)) {
			walkNodes(node.children as unknown[], state, nodePath);
		}
	}
};

const validateRule = (
	rule: unknown,
	state: Collect,
	ownerKey: string,
	role: string,
): void => {
	if (rule === undefined || rule === null) return;
	if (typeof rule !== "object" || Array.isArray(rule)) {
		state.errors.push(
			`شرط ${role} فیلد «${ownerKey}» باید یک شیء ساختاریافته باشد.`,
		);
		return;
	}

	const typed = rule as Record<string, unknown>;
	const op = typeof typed.op === "string" ? typed.op : "";

	if (!KNOWN_RULE_OPS.has(op)) {
		state.errors.push(
			`عملگر «${op}» در شرط ${role} فیلد «${ownerKey}» شناخته نشده است.`,
		);
		return;
	}

	if (op === "and" || op === "or") {
		const rules = typed.rules;
		if (!Array.isArray(rules) || rules.length === 0) {
			state.errors.push(
				`شرط ${role} فیلد «${ownerKey}» باید حداقل یک زیرشرط داشته باشد.`,
			);
			return;
		}
		for (const child of rules) validateRule(child, state, ownerKey, role);
		return;
	}

	if (op === "not") {
		validateRule(typed.rule, state, ownerKey, role);
		return;
	}

	if (PATH_OPS.has(op) && typeof typed.path !== "string") {
		state.errors.push(
			`شرط ${role} فیلد «${ownerKey}» به مسیر فیلد نیاز دارد.`,
		);
	}
};

/**
 * Validate a definition's semantics before it can be activated.
 *
 * Superstruct already checked the envelope (kinds, required strings, enum
 * values). This walks the tree for the things only the engine cares about:
 * unique keys, known rule operators, and well-formed option sources. Rule
 * `path` resolution against field keys is deliberately NOT checked here — a
 * rule may reference a field that appears later in the tree, and a `[]` path
 * segment addresses every row, so a prefix match is the useful check and the
 * builder warns about the rest.
 *
 * Throws Persian errors via `throwError` so the org admin sees an actionable
 * message rather than a stack trace.
 */
export const validateDefinitionStructure = (
	definition: FormDefinition,
): void => {
	const pages = definition?.pages ?? [];
	if (pages.length === 0) {
		throw new Error("فرم باید حداقل یک صفحه داشته باشد");
	}

	const state: Collect = { keys: new Set<string>(), errors: [] };

	for (const page of pages) {
		if (!page.key) state.errors.push("یک صفحه بدون کلید یافت شد.");
		if (!page.title) {
			state.errors.push(`صفحه «${page.key}» باید عنوان داشته باشد.`);
		}
		validateRule(page.visibleWhen, state, page.key, "نمایش");
		validateRule(page.requiredWhen, state, page.key, "الزام");

		for (const section of page.sections ?? []) {
			if (!section.key) state.errors.push("یک بخش بدون کلید یافت شد.");
			if (!section.title) {
				state.errors.push(
					`بخش «${section.key}» باید عنوان داشته باشد.`,
				);
			}
			validateRule(section.visibleWhen, state, section.key, "نمایش");
			validateRule(section.requiredWhen, state, section.key, "الزام");
			walkNodes(section.nodes, state, section.key);
		}
	}

	if (state.errors.length > 0) {
		throw new Error(state.errors[0]);
	}
};

/**
 * Collect the `reference` option sources declared anywhere in a definition, so
 * `getForPatrol` can resolve their options in one batched pass.
 */
export const collectReferenceModels = (
	definition: FormDefinition,
): string[] => {
	const models = new Set<string>();
	const visit = (nodes: unknown[] | undefined) => {
		if (!Array.isArray(nodes)) return;
		for (const raw of nodes) {
			if (typeof raw !== "object" || raw === null) continue;
			const node = raw as Record<string, unknown>;
			const options = node.options as Record<string, unknown> | undefined;
			if (
				options?.kind === "reference" &&
				typeof options.model === "string"
			) {
				models.add(options.model);
			}
			visit(node.children as unknown[] | undefined);
		}
	};
	for (const page of definition?.pages ?? []) {
		for (const section of page.sections ?? []) visit(section.nodes);
	}
	return [...models];
};

/**
 * Assert every declared `reference` model exists and, when the field declares no
 * whitelist, actually has records to choose from. A reference field with zero
 * options would render an empty dropdown in the field.
 */
export const checkReferenceModels = async (
	definition: FormDefinition,
	models: Record<string, unknown>,
): Promise<string[]> => {
	const missing: string[] = [];
	for (const model of collectReferenceModels(definition)) {
		if (!(REFERENCE_MODEL_NAMES as readonly string[]).includes(model)) {
			missing.push(`مدل «${model}» برای گزینه‌های فرم معتبر نیست.`);
			continue;
		}
		const target = getReferenceModel(models, model);
		if (!target) {
			missing.push(`مدل «${model}» در دسترس نیست.`);
			continue;
		}
		const count = await target.countDocument({ filter: {} });
		if (count === 0) {
			missing.push(
				`مدل «${model}» هیچ رکوردی ندارد؛ گزینه‌ای برای نمایش وجود ندارد.`,
			);
		}
	}
	return missing;
};

// ---------------------------------------------------------------------------
// Derived registries — bindings and reference sources
// ---------------------------------------------------------------------------

/**
 * Relations a form question may bind to, derived from the target model.
 *
 * This replaces a free-form `binding.path` string. The previous design let an
 * author type any path, and nothing checked it anywhere: the mobile mapper
 * silently discarded keys it did not recognise (so the officer's answer
 * vanished), while the backend rejected the same key at submit time with an
 * "unknown key" error. Deriving the list from the model's own `mainRelations`
 * makes an invalid path impossible to author in the first place.
 */
export interface BindableRelation {
	/** The relation name as written in a `binding.path`, e.g. `road_defects`. */
	path: string;
	/** The model the relation points at, e.g. `road_defect`. */
	schemaName: string;
	/** True for a `multiple` relation, whose bound key ends in `Ids`. */
	multi: boolean;
	/** True when the relation must be supplied. */
	required: boolean;
}

/**
 * Relations the backend fills in itself, so an author must not bind a question
 * to them: the officer has no way to answer them, and a bound answer would be
 * overwritten or rejected.
 */
const SERVER_OWNED_TARGETS = new Set(["user", "file"]);

/**
 * Every bindable relation on a form kind's target model.
 *
 * `form_kind` maps to the model its answers are stored in, so the same question
 * shape yields a different binding list for an accident form than for a road
 * damage form — which is the point of splitting the models.
 */
export const bindableRelationsFor = (
	formKind: string,
): BindableRelation[] => {
	const targetName = targetModelFor(formKind);

	// Lesan's `getSchemas()` returns the raw registry; each entry carries the
	// model's own `mainRelations`, which is the authoritative list.
	const relations = schemasFor()[targetName]?.mainRelations ?? {};

	const result: BindableRelation[] = [];
	for (const [path, relation] of Object.entries(relations)) {
		const schemaName = relation?.schemaName;
		if (!schemaName) continue;
		if (SERVER_OWNED_TARGETS.has(schemaName)) continue;
		result.push({
			path,
			schemaName,
			multi: relation.type !== "single",
			required: relation.optional !== true,
		});
	}
	// Stable order so the builder's dropdown does not reshuffle between calls.
	result.sort((a, b) => a.path.localeCompare(b.path));
	return result;
};

/** The target model a form kind's answers are stored in. */
const targetModelFor = (formKind: string): string =>
	FORM_KIND_TARGET_MODEL[
		formKind as keyof typeof FORM_KIND_TARGET_MODEL
	] ?? "accident";

type RelationMeta = {
	schemaName?: string;
	type?: string;
	optional?: boolean;
};

type SchemaEntry = {
	mainRelations?: Record<string, RelationMeta>;
	pure?: Record<string, unknown>;
};

const schemasFor = (): Record<string, SchemaEntry | undefined> =>
	getSchemas() as unknown as Record<string, SchemaEntry | undefined>;

/**
 * Pure-field keys on a model, which `pure` and `dto` bindings target.
 *
 * `pure` writes a top-level scalar; `dto` writes one field of a row inside an
 * embedded array such as `vehicle_dtos`.
 */
const pureKeysFor = (modelName: string): Set<string> =>
	new Set(Object.keys(schemasFor()[modelName]?.pure ?? {}));

/**
 * Validate every binding in a definition against the target model.
 *
 * Covers all three binding kinds, because all three used to be unchecked:
 *
 * - `relation` — must name a real relation, with matching arity
 * - `pure`     — must name a real top-level pure field
 * - `dto`      — must name a real embedded array field
 *
 * `dynamic` binds to nothing, by definition.
 */
export const checkBindings = async (
	definition: FormDefinition,
	formKind: string,
): Promise<string[]> => {
	const targetName = targetModelFor(formKind);
	const relations = schemasFor()[targetName]?.mainRelations ?? {};
	const pureKeys = pureKeysFor(targetName);
	const targetLabel = formKind === "accident" ? "تصادف" : "گزارش رخداد";

	const errors: string[] = [];
	const seen = new Set<string>();

	for (const node of collectNodes(definition)) {
		const binding = node.binding;
		if (!binding || binding.kind === "dynamic") continue;

		if (binding.kind === "relation") {
			const key = `relation:${binding.path}`;
			if (seen.has(key)) continue;
			seen.add(key);
			const relation = relations[binding.path];
			if (!relation?.schemaName) {
				errors.push(
					`فیلد «${node.label}» به رابطهٔ «${binding.path}» متصل است که در مدل ${targetLabel} وجود ندارد.`,
				);
				continue;
			}
			if (SERVER_OWNED_TARGETS.has(relation.schemaName)) {
				errors.push(
					`فیلد «${node.label}» به رابطهٔ «${binding.path}» متصل است که سامانه خودش آن را تعیین می‌کند.`,
				);
				continue;
			}
			if (Boolean(binding.multi) !== (relation.type !== "single")) {
				errors.push(
					`رابطهٔ «${binding.path}» ${
						relation.type !== "single" ? "چندانتخابی" : "تک‌انتخابی"
					} است اما فیلد «${node.label}» برعکس تنظیم شده است.`,
				);
			}
			continue;
		}

		// `pure` writes a top-level field; `dto` writes inside an embedded array.
		const fieldName = binding.kind === "pure" ? binding.path : binding.dto;
		const key = `${binding.kind}:${fieldName}`;
		if (seen.has(key)) continue;
		seen.add(key);
		if (!pureKeys.has(fieldName)) {
			errors.push(
				`فیلد «${node.label}» مقدار خود را در «${fieldName}» ذخیره می‌کند که در مدل ${targetLabel} وجود ندارد.`,
			);
		}
	}

	return errors;
};

/** Every field node in a definition, containers descended into. */
const collectNodes = (definition: FormDefinition): FieldNode[] => {
	const found: FieldNode[] = [];
	const visit = (nodes: unknown[] | undefined) => {
		if (!Array.isArray(nodes)) return;
		for (const node of nodes as Array<Record<string, unknown>>) {
			if (!node || typeof node !== "object") continue;
			if (node.kind === "field") found.push(node as unknown as FieldNode);
			visit(node.children as unknown[] | undefined);
		}
	};
	for (const page of definition.pages ?? []) {
		for (const section of page.sections ?? []) {
			visit(section.nodes as unknown[] | undefined);
		}
	}
	return found;
};

/** Every icon name declared anywhere in a definition, plus its option icons. */
export const collectIcons = (definition: FormDefinition): unknown[] => {
	const icons: unknown[] = [
		(definition as unknown as { icon?: unknown }).icon,
	];
	for (const page of definition.pages ?? []) {
		icons.push((page as unknown as { icon?: unknown }).icon);
		for (const section of page.sections ?? []) {
			icons.push((section as unknown as { icon?: unknown }).icon);
			for (
				const node of (section.nodes ?? []) as Array<
					Record<string, unknown>
				>
			) {
				if (!node || typeof node !== "object") continue;
				icons.push(node.icon);
				if (node.kind === "field") {
					const options = node.options as
						| { kind?: string; items?: Array<{ icon?: unknown }> }
						| undefined;
					if (options?.kind === "literal") {
						for (const item of options.items ?? []) {
							icons.push(item.icon);
						}
					}
				}
				visitNodes(node.children as unknown[] | undefined, icons);
			}
		}
	}
	return icons;
};

const visitNodes = (nodes: unknown[] | undefined, into: unknown[]) => {
	if (!Array.isArray(nodes)) return;
	for (const node of nodes as Array<Record<string, unknown>>) {
		if (!node || typeof node !== "object") continue;
		into.push(node.icon);
		visitNodes(node.children as unknown[] | undefined, into);
	}
};

/**
 * Reject icon names outside the shared registry.
 *
 * `shared/form-engine` owns the vocabulary because the backend, the web builder
 * and the phone all have to agree; an unknown name would render as a blank box on
 * whichever app does not recognise it.
 */
export const checkIcons = (
	definition: FormDefinition,
	/** The form's own icon, which lives beside the tree rather than inside it. */
	formIcon?: unknown,
): string[] => {
	const bad = validateIconNames([formIcon, ...collectIcons(definition)]);
	if (bad.length === 0) return [];
	const unique = [...new Set(bad)];
	return [
		`آیکون‌های نامعتبر در فرم: ${unique.join("، ")}`,
	];
};

/**
 * Reference models a `reference` field may draw options from, with whether each
 * has records.
 *
 * The builder used to keep its own hardcoded list, which had already drifted 16
 * models behind the server allow-list. It now reads this.
 */
export const referenceModelsFor = async (
	models: Record<string, unknown>,
): Promise<Array<{ model: string; hasRecords: boolean }>> => {
	const result: Array<{ model: string; hasRecords: boolean }> = [];
	for (const model of REFERENCE_MODEL_NAMES) {
		const target = getReferenceModel(models, model);
		if (!target) continue;
		const count = await target.countDocument({ filter: {} });
		result.push({ model, hasRecords: count > 0 });
	}
	return result;
};

/**
 * A relation binding only works on a `reference` field.
 *
 * A `reference` field's answer is a record id, which is what a Lesan relation
 * expects. Every other field type answers with the author's own text or a literal
 * option value — binding one of those to a relation produces a payload the backend
 * rejects at submit time (`typeId: optional(objectIdValidation)` refuses
 * `'خسارتی'`), so the officer fills the form, presses submit, and the report is
 * thrown away with an "unknown key" error they cannot act on.
 *
 * Caught here instead, at publish time, where the author can still fix it. Custom
 * answers belong in `dynamic_answers`, which stores them losslessly either way.
 */
const validateBindingSource = (
	node: FieldNode,
	state: { errors: string[] },
	key: string,
): void => {
	const binding = node.binding;
	if (!binding) return;
	if (binding.kind === "dynamic" || binding.kind === "pure") return;

	if (node.options?.kind !== "reference") {
		state.errors.push(
			`اتصال فیلد «${key}» به ${
				binding.kind === "relation" ? "رابطه" : "جدول"
			} فقط برای فیلدهای «فهرست مرجع» مجاز است؛ پاسخ این فیلد مقدار آزاد است.`,
		);
	}
};
