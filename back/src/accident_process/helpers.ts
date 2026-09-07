import { ObjectId } from "@deps";
import { unit } from "../../mod.ts";

/**
 * حل organization._id کاربر مأمور گشت از مسیر unit.organization یا
 * user.organizations — برای getForPatrol (بدون ورودی اضافه).
 */
export const resolveUserOrgId = async (
	userId: ObjectId,
): Promise<string | null> => {
	const u = await unit.findOne({
		filters: { "officers._id": userId },
		projection: { "organization._id": 1 },
	});
	const orgId = (u as any)?.organization?._id as ObjectId | undefined;
	return orgId ? orgId.toString() : null;
};
