import { ObjectId } from "@deps";
import { organization } from "../../mod.ts";
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
	const scope: Record<string, unknown> = {
		"officer.level": "Patrol",
		"road._id": { $in: roads },
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
