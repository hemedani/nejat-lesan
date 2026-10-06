import { ObjectId } from "@deps";
import { organization, unit } from "../../mod.ts";
import { getScopedOrgIds } from "../app_modules/orgScope.ts";
import type { MyContext } from "@lib";

type ActorUser = MyContext["user"];

export const isManagerViewer = (level?: string): boolean =>
	level === "Manager" || level === "Ghost";

export const isOrgLeaderLevel = (level?: string): boolean =>
	level === "OrgHead" || level === "UnitHead";

/**
 * Scope گزارش‌ها برای کاربرِ سازمانی (OrgHead/UnitHead): جاده‌های سازمان‌های
 * در محدوده‌ی نقشش. برای کاربر سراسری null برمی‌گرداند (بدون محدودیت جاده).
 */
export const getOrgScopedRoadIds = async (
	actor: ActorUser,
): Promise<ObjectId[] | null> => {
	if (isManagerViewer(actor.level)) return null;
	if (!isOrgLeaderLevel(actor.level)) return null;

	const orgIds = await getScopedOrgIds(actor);
	if (!orgIds.length) return [];
	const orgs = await organization
		.find({
			filters: { _id: { $in: orgIds.map((id) => new ObjectId(id)) } },
			projection: { "road._id": 1 },
		})
		.toArray();
	return orgs
		.map((org) => (org as { road?: { _id?: ObjectId } }).road?._id)
		.filter((roadId): roadId is ObjectId => Boolean(roadId));
};

/**
 * فیلتر سرور-محور گزارش‌ها:
 * - مأمور گشت: فقط گزارش‌های خودش.
 * - مدیر/گوست: همه‌ی گزارش‌های مأموران (اختیاری userId برای یک مأمور خاص).
 * - سرپرست آزادراه/واحد: گزارش‌های مأمورانِ محدود به جاده‌های سازمان‌هایش.
 */
export const getOrgReportBase = async (
	actor: ActorUser,
	userId?: string,
): Promise<Record<string, unknown>> => {
	if (actor.level === "Patrol") {
		return { "officer._id": new ObjectId(actor._id) };
	}

	if (isManagerViewer(actor.level)) {
		const scope: Record<string, unknown> = { "officer.level": "Patrol" };
		if (userId) scope["officer._id"] = new ObjectId(userId);
		return scope;
	}

	if (!isOrgLeaderLevel(actor.level)) {
		throw new Error("شما اجازه مشاهده گزارش‌ها را ندارید");
	}

	const roads = await getOrgScopedRoadIds(actor);
	if (!roads?.length) {
		throw new Error("شما دسترسی به گزارش‌های این سازمان ندارید");
	}
	// Two clauses, and an `$or` rather than a merge, because a report filed from the
	// patrol app carries the officer's `organization`, while an older row may carry only
	// a `road`.
	//
	// Measured against the production-shaped collection, though, the second clause does
	// not currently reach anything, and the reason is the term above it rather than the
	// `$or`. Of 52,842 accidents:
	//
	//   officer.level absent · organization absent · road present ....... 52,809
	//   officer.level absent · organization absent · road absent .........     18
	//   officer.level Patrol  · organization present · road absent ........     14
	//   officer.level Patrol  · organization absent · road absent .........      1
	//
	// The legacy catalogue carries a `road` but **no officer at all**, so
	// `"officer.level": "Patrol"` excludes it before the `$or` is ever evaluated: the
	// `road._id` clause matches 0 rows, and no row has both an organization and a road.
	// The two populations are not disjoint — the road population sits entirely outside
	// the gate. The org-leader console therefore shows 14 reports, not ~52,000.
	//
	// The clause is kept rather than deleted because it is the only hook that would pick
	// the legacy catalogue up if `officer.level` is ever backfilled onto those rows, and
	// removing it would make that a code change instead of a data change. Anyone widening
	// this scope to include the legacy rows has to relax `officer.level` too — matching
	// on `road._id` alone does nothing.
	//
	// This is the shape `incident_report/oversight/filters.ts` mirrors for the Manager
	// narrowing.
	const orgIds = await getScopedOrgIds(actor);
	const scope: Record<string, unknown> = {
		"officer.level": "Patrol",
		$or: [
			{
				"organization._id": {
					$in: orgIds.map((id) => new ObjectId(id)),
				},
			},
			{ "road._id": { $in: roads } },
		],
	};
	if (userId) scope["officer._id"] = new ObjectId(userId);
	return scope;
};

/**
 * Returns the server-enforced report scope. Manager assignments are not yet
 * represented by a relation, so managers currently receive patrol reports;
 * the scope can be narrowed here when that organizational relation exists.
 */
export const getReportScope = (
	actor: ActorUser,
	userId?: string,
): Record<string, unknown> => {
	if (actor.level === "Patrol") {
		return { "officer._id": new ObjectId(actor._id) };
	}

	if (actor.level === "Manager" || actor.level === "Ghost") {
		const scope: Record<string, unknown> = { "officer.level": "Patrol" };
		if (userId) scope["officer._id"] = new ObjectId(userId);
		return scope;
	}

	throw new Error("شما اجازه مشاهده گزارش‌ها را ندارید");
};

/**
 * Which organization a report should be filed under.
 *
 * Returns an organization **only when the actor's unit set resolves to a single
 * organization.** Anything else returns `null`, which is not an error: the report
 * is still filed, and the console groups it under "unlinked"
 * (`cleanupDemoSeed` targets exactly those rows).
 *
 * `unit.officers` is the only trustworthy source here, never `user.unit`. The
 * reverse of a single relation is written with an unconditional `$set`, so seating
 * an officer in a second unit silently moves `user.unit` while the first unit's
 * `officers` array still lists them — the exact state in which a report cannot be
 * attributed to any console. `people.ts` rejects that membership for the same
 * reason, and the demo seed keeps every officer in exactly one unit.
 *
 * A genuine multi-organization actor is disambiguated by `roadId`, since each
 * highway is one organization and the oversight console already treats
 * `organization._id` and `road._id` as the same attribution. It never picks
 * arbitrarily: if the road's organization does not narrow the candidate set to
 * one, the answer stays `null`. The extra lookup is paid only when the set is
 * already ambiguous, so the ordinary single-unit path stays one query.
 */
export const resolveFilingOrgId = async (
	actor: ActorUser,
	roadId?: string | null,
): Promise<ObjectId | null> => {
	const units = await unit
		.find({
			filters: { "officers._id": new ObjectId(actor._id) },
			projection: { "organization._id": 1 },
		})
		.toArray();

	const orgIds = new Set<string>();
	for (const u of units) {
		const id = (u as { organization?: { _id?: ObjectId } })?.organization?._id;
		if (id) orgIds.add(id.toString());
	}

	if (orgIds.size === 1) return new ObjectId([...orgIds][0]);
	if (orgIds.size === 0 || !roadId || !ObjectId.isValid(roadId)) return null;

	const onRoad = await organization.findOne({
		filters: { "road._id": new ObjectId(roadId) },
		projection: { _id: 1 },
	});
	const roadOrgId = (onRoad as { _id?: ObjectId } | null)?._id;
	return roadOrgId && orgIds.has(roadOrgId.toString()) ? roadOrgId : null;
};
