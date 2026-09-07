import { ObjectId } from "@deps";
import { unit } from "../mod.ts";

/**
 * حل محدوده واحدهای مجاز بر اساس نقش کاربر (Satek §6):
 * - Ghost/Manager: نامحدود → null
 * - نقش scopeType:"organization" → همه واحدهای آن سازمان
 * - نقش scopeType:"unit" → همان واحد؛ اگر کاربر head انبار (Warehouse) باشد،
 *   کل سازمان را می‌بیند (warehouse bypass)
 * - بدون نقش سازمانی → لیست خالی (بدون دسترسی)
 */
export const getScopedUnitIds = async (
	user: {
		_id: unknown;
		level?: string;
		roles?: Array<{
			scopeType?: string;
			scopeId?: string;
		}>;
	},
): Promise<ObjectId[] | null> => {
	if (user.level === "Ghost" || user.level === "Manager") return null;

	const roles = user.roles || [];
	const unitIds = new Set<string>();
	const orgIds = new Set<string>();

	for (const r of roles) {
		if (r.scopeType === "unit" && r.scopeId) {
			unitIds.add(r.scopeId);
		}
		if (r.scopeType === "organization" && r.scopeId) {
			orgIds.add(r.scopeId);
		}
	}

	// Warehouse bypass: رئیس یک واحد از نوع Warehouse، کل سازمان را می‌بیند.
	const headedWarehouses = await unit
		.find({
			filters: { "head._id": user._id, type: "Warehouse" },
			projection: { _id: 1, "organization._id": 1 },
		})
		.toArray();
	for (const w of headedWarehouses) {
		const oid = (w as any).organization?._id as ObjectId | undefined;
		if (oid) orgIds.add(oid.toString());
	}

	if (orgIds.size > 0) {
		const orgUnits = await unit
			.find({
				filters: { "organization._id": { $in: [...orgIds].map((id) => new ObjectId(id)) } },
				projection: { _id: 1 },
			})
			.toArray();
		for (const u of orgUnits) unitIds.add(u._id.toString());
	}

	return [...unitIds].map((id) => new ObjectId(id));
};
