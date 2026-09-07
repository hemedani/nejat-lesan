import { ObjectId } from "@deps";
import { unit } from "../../mod.ts";

/**
 * حل organization._idهای مجاز/وابسته‌ی یک کاربر (مکمل unitScope).
 * - Ghost/Manager: سازمانی مشخص ندارند (سراسری) → []
 * - نقش scopeType:"organization" → scopeId
 * - نقش scopeType:"unit" → organization همان واحد
 * - مأمور گشت بدون نقش → organization از واحد گشتش (unit.officers)
 * - head انبار (Warehouse) → organization همان واحد انبار
 */
export const getScopedOrgIds = async (user: {
	_id: unknown;
	level?: string;
	roles?: Array<{ scopeType?: string; scopeId?: string }>;
}): Promise<string[]> => {
	if (user.level === "Ghost" || user.level === "Manager") return [];

	const roles = user.roles || [];
	const orgs = new Set<string>();

	for (const r of roles) {
		if (r.scopeType === "organization" && r.scopeId) orgs.add(r.scopeId);
	}
	const unitScopes = roles
		.filter((r) => r.scopeType === "unit" && r.scopeId)
		.map((r) => r.scopeId as string);

	if (unitScopes.length > 0) {
		const units = await unit
			.find({
				filters: { _id: { $in: unitScopes.map((id) => new ObjectId(id)) } },
				projection: { "organization._id": 1 },
			})
			.toArray();
		for (const u of units) {
			const oid = (u as any).organization?._id as ObjectId | undefined;
			if (oid) orgs.add(oid.toString());
		}
	}

	// مأمور گشت / عضو واحد: از طریق unit.officers
	if (orgs.size === 0 || user.level === "Patrol") {
		const officerUnit = await unit.findOne({
			filters: { "officers._id": new ObjectId(user._id as string) },
			projection: { "organization._id": 1 },
		});
		const oid = (officerUnit as any)?.organization?._id as ObjectId | undefined;
		if (oid) orgs.add(oid.toString());
	}

	// head انبار → سازمان انبارش
	if (user.level !== "Patrol") {
		const headedWarehouses = await unit
			.find({
				filters: { "head._id": new ObjectId(user._id as string), type: "Warehouse" },
				projection: { "organization._id": 1 },
			})
			.toArray();
		for (const w of headedWarehouses) {
			const oid = (w as any).organization?._id as ObjectId | undefined;
			if (oid) orgs.add(oid.toString());
		}
	}

	return [...orgs];
};
