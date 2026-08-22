import { type ActFn, ObjectId } from "@deps";
import { coreApp, announcement, shift } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "@lib";

export const getUnreadCountFn: ActFn = async (body) => {
	const context: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;
	const actor = context.user;

	// Only Patrol users can check unread count
	if (actor.level !== "Patrol") {
		return throwError("شما اجازه این کار را ندارید");
	}

	// Build filter for announcements targeting this patrol officer
	const filter: Record<string, any> = {
		is_active: true,
	};

	const orConditions: Record<string, any>[] = [
		{ target_roles: { $size: 0 } },
		{ target_roles: { $in: [actor.level] } },
	];

	// Get officer's active patrol unit
	const activeShift = await shift.findOne({
		filters: {
			"officer._id": new ObjectId(actor._id),
			status: "active",
		},
		projection: { patrol_unit: 1 },
	});

	if (activeShift?.patrol_unit?._id) {
		const patrolUnitId = activeShift.patrol_unit._id.toString();
		orConditions.push(
			{ target_patrol_units: { $size: 0 } },
			{ target_patrol_units: { $in: [patrolUnitId] } },
		);
	}

	orConditions.push(
		{ target_user_ids: { $size: 0 } },
		{ target_user_ids: { $in: [actor._id.toString()] } },
	);

	filter.$or = orConditions;

	// Handle expires_at - only show non-expired
	filter.$or = [
		...(filter.$or || []),
		{ expires_at: { $exists: false } },
		{ expires_at: null },
		{ expires_at: { $gte: new Date() } },
	];

	// Count total matching announcements
	const totalCount = await announcement.countDocument({
		filter: filter,
	});

	// In a full implementation with read tracking, we'd subtract read count
	// For now, return total as unread
	return { count: totalCount };
};