import { type ActFn, type ObjectId } from "@deps";
import {
	accident,
	air_status,
	croquis_type,
	damage_severity,
	driver_status,
	equipment_damage,
	form_definition,
	form_response,
	incident_report,
	incident_severity,
	injury_status,
	light_status,
	module_config,
	organization,
	person_role,
	position,
	road,
	road_defect,
	road_situation,
	road_surface_condition,
	unit,
	user,
	vehicle,
	vehicle_final_status,
	vehicle_type,
	ware,
} from "../../../mod.ts";
import { SEED_SHARED_MARKER } from "../../shared/seedShared/seedShared.fn.ts";
import { DEMO_ORG_CODE } from "../seedDemoOrganization/org.ts";
import { DEMO_EMAIL_DOMAIN } from "../seedDemoOrganization/people.ts";

/**
 * Removes what the seeding acts created, so a demo can be rebuilt from scratch.
 *
 * Three things shape the design:
 *
 * 1. **Dry run first.** `confirm` defaults to `false`, so the first call always
 *    reports what it *would* remove and removes nothing. Deleting data is not
 *    recoverable from the API, and a mis-click in the Playground must not be
 *    able to do it.
 *
 * 2. **Detach, then delete — in both directions.** Lesan refuses to delete a
 *    document while *any* relation still points at it, whichever side that
 *    relation lives on. Deleting a vehicle therefore fails while `unit.vehicles`
 *    still embeds it, exactly as deleting the unit fails while a vehicle points
 *    back. So every relation that reaches a document we are about to remove is
 *    cleared with `removeRelation` first, and only then does deletion run
 *    leaves-first. (`back/AGENTS.md` describes the child case as automatic; as
 *    implemented in Lesan 0.1.26 it is not, and this act is written against what
 *    the ODM actually does.)
 *
 *    Anything still blocking a delete surfaces as that act's own Persian error
 *    rather than a silent skip.
 *
 * 3. **Only what the seeds own.** `demo` matches on the same stable keys the
 *    seed uses (`organization.code`, the email domain), never on "everything".
 *    `reference` deletes only rows carrying `SEED_SHARED_MARKER`, because the
 *    seed *skips* names that already exist — so a pre-existing row sharing a
 *    seeded name is unstampable and must survive. Those are reported as
 *    `preserved` rather than passed over in silence.
 */

export type CleanupScope = "demo" | "reference" | "modules" | "all";

type Row = { _id?: ObjectId; name?: string };

/**
 * `unknown` rather than a structural type: Lesan's per-model generics make a
 * shared helper's parameter fail contravariantly, and `unknown` accepts every
 * model. The cast is here, once, instead of `any` at each call site.
 */
type Finder = {
	find: (q: unknown) => { toArray: () => Promise<unknown> };
};
const collect = async (
	model: unknown,
	filters: Record<string, unknown>,
): Promise<ObjectId[]> => {
	const m = model as Finder;
	const rows = await m.find({
		filters,
		projection: { _id: 1, name: 1 },
	}).toArray() as Row[];
	return rows.map((row) => row._id).filter(Boolean) as ObjectId[];
};

/**
 * The reference models `user.seedShared` writes to, paired with a label for the
 * response. Mirrors the seed's own table; the test asserts the two agree, so a
 * model added to one and forgotten in the other fails rather than leaks.
 */
/**
 * A function, not a module-level const: this act is registered during
 * `functionsSetup`, which runs before `back/mod.ts` has finished instantiating
 * every model, so reading `vehicle_type` at module scope is a temporal-dead-zone
 * crash. Resolved on first call instead, by which time the models exist.
 */
export const seedSharedReferenceModels = (): Array<
	{ key: string; model: unknown }
> => [
	{ key: "vehicle_type", model: vehicle_type },
	{ key: "croquis_type", model: croquis_type },
	{ key: "vehicle_final_status", model: vehicle_final_status },
	{ key: "driver_status", model: driver_status },
	{ key: "injury_status", model: injury_status },
	{ key: "person_role", model: person_role },
	{ key: "damage_severity", model: damage_severity },
	{ key: "incident_severity", model: incident_severity },
	{ key: "air_status", model: air_status },
	{ key: "light_status", model: light_status },
	{ key: "position", model: position },
	{ key: "road_situation", model: road_situation },
	{ key: "road_surface_condition", model: road_surface_condition },
	{ key: "road_defect", model: road_defect },
	{ key: "equipment_damage", model: equipment_damage },
	{ key: "ware", model: ware },
];

/** Everything a scope matched, discovered before anything is written. */
type Found = {
	organizations: ObjectId[];
	roads: ObjectId[];
	units: ObjectId[];
	users: ObjectId[];
	vehicles: ObjectId[];
	formDefinitions: ObjectId[];
	formResponses: ObjectId[];
	accidents: ObjectId[];
	incidentReports: ObjectId[];
	referenceRows: Array<{ key: string; _id: ObjectId }>;
	preservedNames: string[];
	moduleConfig: boolean;
};

/** Clear `relations` on every document matched by `filters`. */
type Detacher = { removeRelation: (q: unknown) => Promise<unknown> };
const detach = async (
	model: unknown,
	filters: Record<string, unknown>,
	relations: Record<string, unknown>,
): Promise<void> => {
	if (Object.keys(relations).length === 0) return;
	await (model as Detacher).removeRelation({ filters, relations });
};

const empty = (): Found => ({
	organizations: [],
	roads: [],
	units: [],
	users: [],
	vehicles: [],
	formDefinitions: [],
	formResponses: [],
	accidents: [],
	incidentReports: [],
	referenceRows: [],
	preservedNames: [],
	moduleConfig: false,
});

const findDemo = async (): Promise<Found> => {
	const found = empty();
	const orgRows = await organization.find({
		filters: { code: DEMO_ORG_CODE },
		projection: { _id: 1, road: 1 },
	}).toArray() as Array<{ _id: ObjectId; road?: { _id?: ObjectId } }>;
	if (orgRows.length === 0) return found;

	found.organizations = orgRows.map((row) => row._id);
	const orgIds = found.organizations;
	found.roads = orgRows
		.map((row) => row.road?._id)
		.filter(Boolean) as ObjectId[];

	found.units = await collect(unit, { "organization._id": { $in: orgIds } });
	const unitIds = found.units;

	// Membership by organization OR by the seed's own email domain. The domain
	// catches a person the seed created before it could attach them, which is
	// exactly the half-seeded state this act exists to clean up.
	found.users = await collect(user, {
		$or: [
			{ "organizations._id": { $in: orgIds } },
			{ email: { $regex: `@${DEMO_EMAIL_DOMAIN}$`, $options: "i" } },
		],
	});
	const userIds = found.users;

	if (unitIds.length) {
		found.vehicles = await collect(vehicle, {
			"unit._id": { $in: unitIds },
		});
	}
	found.formDefinitions = await collect(form_definition, {
		"organization._id": { $in: orgIds },
	});
	found.formResponses = await collect(form_response, {
		"organization._id": { $in: orgIds },
	});

	// Reports filed by our officers count even without an organization link —
	// `resolveFilingOrgId` can leave it empty, and those are exactly the rows
	// that would block deleting the officer.
	const reportScopes: Record<string, unknown>[] = [
		{ "organization._id": { $in: orgIds } },
	];
	if (userIds.length) {
		reportScopes.push({ "officer._id": { $in: userIds } });
	}
	found.accidents = await collect(accident, { $or: reportScopes });
	found.incidentReports = await collect(incident_report, {
		$or: reportScopes,
	});

	return found;
};

const findReference = async (): Promise<Found> => {
	const found = empty();
	for (const { key, model } of seedSharedReferenceModels()) {
		const m = model as Finder;
		const stamped = await m.find({
			filters: { seed: SEED_SHARED_MARKER },
			projection: { _id: 1, name: 1 },
		}).toArray() as Row[];
		for (const row of stamped) {
			if (row._id) found.referenceRows.push({ key, _id: row._id });
		}

		// Rows the seed *skipped* because the name already existed. They carry no
		// marker by construction, so they are the rows a name-based cleanup would
		// destroy. Named rather than counted, so the operator can see what was
		// deliberately left in place.
		const unstamped = await m.find({
			filters: { seed: { $exists: false } },
			projection: { _id: 1, name: 1 },
		}).toArray() as Row[];
		for (const row of unstamped) {
			if (row.name) found.preservedNames.push(`${key}: ${row.name}`);
		}
	}
	return found;
};

const findModules = async (): Promise<Found> => {
	const found = empty();
	const doc = await module_config.findOne({
		filters: { key: "app_modules" },
		projection: { _id: 1 },
	});
	found.moduleConfig = Boolean(doc);
	return found;
};

/**
 * Delete a set of documents one at a time.
 *
 * `deleteOne` per id rather than a bulk delete, for two reasons: the dry run has
 * to report exactly what would go, and a bulk delete would bypass the
 * parent-has-children guard that makes the ordering above safe. `hardCascade`
 * is deliberately never passed — a wrong cascade here would take unrelated
 * rows with it.
 */
type Deleter = { deleteOne: (q: unknown) => Promise<unknown> };
const removeAll = async (
	model: unknown,
	ids: ObjectId[],
): Promise<number> => {
	const m = model as Deleter;
	let removed = 0;
	for (const id of ids) {
		await m.deleteOne({ filter: { _id: id }, hardCascade: false });
		removed++;
	}
	return removed;
};

export const cleanupDemoSeedFn: ActFn = async (body) => {
	const { set } = body.details;
	const requested = (set.scope ?? ["all"]) as string[];
	const confirm = set.confirm === true;

	const scopes = new Set<CleanupScope>(
		requested.includes("all")
			? ["demo", "reference", "modules"]
			: requested as CleanupScope[],
	);

	const found = empty();
	if (scopes.has("demo")) {
		const demo = await findDemo();
		for (const key of Object.keys(found) as Array<keyof Found>) {
			const value = demo[key];
			if (Array.isArray(value)) (found[key] as unknown[]) = value;
			else (found[key] as unknown) = value;
		}
	}
	if (scopes.has("reference")) {
		const reference = await findReference();
		found.referenceRows = reference.referenceRows;
		found.preservedNames = reference.preservedNames;
	}
	if (scopes.has("modules")) {
		const modules = await findModules();
		found.moduleConfig = modules.moduleConfig;
	}

	const counts = {
		organizations: found.organizations.length,
		roads: found.roads.length,
		units: found.units.length,
		users: found.users.length,
		vehicles: found.vehicles.length,
		formDefinitions: found.formDefinitions.length,
		formResponses: found.formResponses.length,
		accidents: found.accidents.length,
		incidentReports: found.incidentReports.length,
		referenceRows: found.referenceRows.length,
		moduleConfig: found.moduleConfig ? 1 : 0,
	};
	const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

	if (!confirm) {
		// The whole point of the dry run: say exactly what a confirming call
		// would remove, so the decision is made with the numbers in hand.
		return {
			dryRun: true,
			deleted: false,
			scope: [...scopes],
			wouldDelete: counts,
			total,
			preserved: {
				referenceRows: found.preservedNames.length,
				names: found.preservedNames.slice(0, 50),
				note:
					"ردیف‌های بدون مُهر seedShared هستند و عمداً حفظ می‌شوند؛ اگر نامشان با داده‌ی موجود هم‌نام باشد، حذف بر پایه‌ی نام آن‌ها را نابود می‌کرد.",
			},
			nothingToDo: total === 0,
		};
	}

	const deleted: Record<string, number> = {
		organizations: 0,
		roads: 0,
		units: 0,
		users: 0,
		vehicles: 0,
		formDefinitions: 0,
		formResponses: 0,
		accidents: 0,
		incidentReports: 0,
		referenceRows: 0,
		moduleConfig: 0,
	};

	// `removeRelation` checks that every id it is handed is actually present in
	// that document's array and throws otherwise, so each parent is read first
	// and only the ids it really holds are detached. Passing the whole set to
	// every unit would fail on the ten vehicles belonging to other units.
	// Detach through the side that DECLARES the relation. Lesan's
	// auto-created reverses (`organization.members`, `road.units`,
	// `organization.form_definitions`, `vehicle.unit`) are denormalised copies it
	// maintains itself: they are absent from `mainRelations`, and `removeRelation`
	// throws `foundedSchema.relations[rel]` undefined for them. So every reverse is
	// cleared by removing the owning relation instead — `user.organizations` for
	// `organization.members`, `unit.road` for `road.units`, and so on.
	const idsIn = (
		rows: Array<{ _id?: ObjectId }> | undefined,
		wanted: ObjectId[],
	): ObjectId[] => {
		const present = new Set(
			(rows ?? []).map((row) => row._id?.toString()).filter(
				Boolean,
			) as string[],
		);
		return wanted.filter((id) => present.has(id.toString()));
	};
	const multi = (ids: ObjectId[]) => ({ _ids: ids, relatedRelations: {} });
	// A `single` relation takes a bare ObjectId, not a one-element array —
	// `handleSingleRelation` looks the target up with `findOne({_id: _ids})`, and
	// an array there is an exact-match query that matches nothing.
	const single = (id: ObjectId) => ({ _ids: id, relatedRelations: {} });
	const isOneOf = (id: ObjectId | undefined, wanted: ObjectId[]) =>
		id ? idsIn([{ _id: id }], wanted) : [];

	// `unit.organization` and `unit.road` own `organization.units` and
	// `road.units`; clearing them here is what lets those parents be deleted.
	for (const unitId of found.units) {
		const current = await unit.findOne({
			filters: { _id: unitId },
			projection: {
				vehicles: 1,
				officers: 1,
				head: 1,
				road: 1,
				parentUnit: 1,
			},
		}) as unknown as {
			vehicles?: Array<{ _id?: ObjectId }>;
			officers?: Array<{ _id?: ObjectId }>;
			head?: { _id?: ObjectId };
			road?: { _id?: ObjectId };
			parentUnit?: { _id?: ObjectId };
		} | null;
		if (!current) continue;

		const vehicles = idsIn(current.vehicles, found.vehicles);
		const officers = idsIn(current.officers, found.users);
		const head = isOneOf(current.head?._id, found.users);
		const roadId = isOneOf(current.road?._id, found.roads);
		const parent = isOneOf(current.parentUnit?._id, found.units);

		// `unit.organization` is deliberately NOT detached: it is `optional:
		// false`, so Lesan refuses to remove a required relation ("please use
		// addRelation to replace it"). The unit is about to be deleted, and a
		// delete is the only legal way to end that link.
		await detach(unit, { _id: unitId }, {
			...(vehicles.length ? { vehicles: multi(vehicles) } : {}),
			...(officers.length ? { officers: multi(officers) } : {}),
			...(head.length ? { head: single(head[0]) } : {}),
			...(roadId.length ? { road: single(roadId[0]) } : {}),
			...(parent.length ? { parentUnit: single(parent[0]) } : {}),
		});
	}

	// `user.organizations` and `user.units` own `organization.members` and
	// `unit.members`.
	for (const userId of found.users) {
		const current = await user.findOne({
			filters: { _id: userId },
			projection: { organizations: 1, units: 1 },
		}) as unknown as {
			organizations?: Array<{ _id?: ObjectId }>;
			units?: Array<{ _id?: ObjectId }>;
		} | null;
		if (!current) continue;

		const orgs = idsIn(current.organizations, found.organizations);
		const units = idsIn(current.units, found.units);
		await detach(user, { _id: userId }, {
			...(orgs.length ? { organizations: multi(orgs) } : {}),
			...(units.length ? { units: multi(units) } : {}),
		});
	}

	// `organization.road` owns `road.organization`.
	for (const orgId of found.organizations) {
		const current = await organization.findOne({
			filters: { _id: orgId },
			projection: { road: 1, head: 1 },
		}) as unknown as {
			road?: { _id?: ObjectId };
			head?: { _id?: ObjectId };
		} | null;
		if (!current) continue;

		const roadId = isOneOf(current.road?._id, found.roads);
		const head = isOneOf(current.head?._id, found.users);
		await detach(organization, { _id: orgId }, {
			...(roadId.length ? { road: single(roadId[0]) } : {}),
			...(head.length ? { head: single(head[0]) } : {}),
		});
	}

	// Leaves first. A parent delete raises its own Persian error if something
	// still references it, which is the behaviour we want: a loud stop, not a
	// cascade that quietly takes unrelated rows.
	deleted.incidentReports = await removeAll(
		incident_report,
		found.incidentReports,
	);
	deleted.accidents = await removeAll(accident, found.accidents);
	deleted.formResponses = await removeAll(form_response, found.formResponses);
	deleted.formDefinitions = await removeAll(
		form_definition,
		found.formDefinitions,
	);
	deleted.vehicles = await removeAll(vehicle, found.vehicles);
	deleted.units = await removeAll(unit, found.units);
	deleted.users = await removeAll(user, found.users);
	deleted.organizations = await removeAll(organization, found.organizations);
	// The road is referenced by the organization, so it goes last.
	deleted.roads = await removeAll(road, found.roads);

	const byModel = new Map<string, ObjectId[]>();
	for (const row of found.referenceRows) {
		const list = byModel.get(row.key) ?? [];
		list.push(row._id);
		byModel.set(row.key, list);
	}
	for (const [key, ids] of byModel) {
		const entry = seedSharedReferenceModels().find((r) => r.key === key);
		if (!entry) continue;
		deleted.referenceRows += await removeAll(entry.model, ids);
	}

	if (found.moduleConfig) {
		// Deleting the singleton is enough: `ensureModuleConfig` recreates it as
		// all-on at the next boot, which is the documented default.
		await module_config.deleteOne({
			filter: { key: "app_modules" },
			hardCascade: false,
		});
		deleted.moduleConfig = 1;
	}

	return {
		dryRun: false,
		deleted: true,
		scope: [...scopes],
		removed: deleted,
		total: Object.values(deleted).reduce((sum, n) => sum + n, 0),
		preserved: {
			referenceRows: found.preservedNames.length,
			names: found.preservedNames.slice(0, 50),
		},
	};
};
