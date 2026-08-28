import { ObjectId } from "@deps";
import { shift } from "../../mod.ts";
import type { MyContext } from "@lib";

/**
 * فیلتر «اعلامیه‌های قابل مشاهده» برای یک کاربر پاترول.
 *
 * منطق (هر بُعد هدف‌گذاری مستقل است و همه باید همزمان برقرار باشند):
 *  - فعال باشد
 *  - منقضی نشده باشد
 *  - target_roles خالی یا شامل نقش کاربر
 *  - target_user_ids خالی یا شامل کاربر
 *  - target_patrol_units خالی یا شامل یگانِ شیفت فعال کاربر
 */
export const buildVisibleAnnouncementsFilter = async (
	actor: MyContext["user"],
	options: { includeInactive?: boolean } = {},
): Promise<Record<string, any>> => {
	const andConditions: Record<string, any>[] = [];

	if (!options.includeInactive) {
		andConditions.push({ is_active: true });
	}

	// --- expiry dimension ---
	andConditions.push({
		$or: [
			{ expires_at: { $exists: false } },
			{ expires_at: null },
			{ expires_at: { $gt: new Date() } },
		],
	});

	// --- role dimension ---
	andConditions.push({
		$or: [
			{ target_roles: { $exists: false } },
			{ target_roles: { $size: 0 } },
			{ target_roles: { $in: [actor.level] } },
		],
	});

	// --- user dimension ---
	andConditions.push({
		$or: [
			{ target_user_ids: { $exists: false } },
			{ target_user_ids: { $size: 0 } },
			{ target_user_ids: { $in: [actor._id.toString()] } },
		],
	});

	// --- patrol unit dimension (only when an active shift exists) ---
	const activeShift = await shift.findOne({
		filters: {
			"officer._id": new ObjectId(actor._id),
			status: "active",
		},
		projection: { patrol_unit: 1 },
	});

	if (activeShift?.patrol_unit?._id) {
		const patrolUnitId = activeShift.patrol_unit._id.toString();
		andConditions.push({
			$or: [
				{ target_patrol_units: { $exists: false } },
				{ target_patrol_units: { $size: 0 } },
				{ target_patrol_units: { $in: [patrolUnitId] } },
			],
		});
	}

	return { $and: andConditions };
};
