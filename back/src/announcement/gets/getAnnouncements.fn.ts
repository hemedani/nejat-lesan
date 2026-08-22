import { type ActFn, ObjectId } from "@deps";
import { coreApp, announcement, shift, patrol_unit } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "@lib";

export const getAnnouncementsFn: ActFn = async (body) => {
	const {
		set: { page, limit, skip, priority, is_active },
		get,
	} = body.details;
	const context: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;
	const actor = context.user;

	// Build filter based on user's role and patrol unit
	const filter: Record<string, any> = {
		is_active: is_active !== "false",
	};

	if (priority) {
		filter.priority = priority;
	}

	// For Patrol users, filter by their target_roles and target_patrol_units
	if (actor.level === "Patrol") {
		const orConditions: Record<string, any>[] = [
			{ target_roles: { $size: 0 } }, // No role restriction
			{ target_roles: { $in: [actor.level] } }, // Targets Patrol role
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
				{ target_patrol_units: { $size: 0 } }, // No patrol unit restriction
				{ target_patrol_units: { $in: [patrolUnitId] } }, // Targets their patrol unit
			);
		}

		orConditions.push(
			{ target_user_ids: { $size: 0 } }, // No user restriction
			{ target_user_ids: { $in: [actor._id.toString()] } }, // Targets this user
		);

		filter.$or = orConditions;
	}

	// Handle expires_at - only show non-expired
	filter.$or = [
		...(filter.$or || []),
		{ expires_at: { $exists: false } },
		{ expires_at: null },
		{ expires_at: { $gte: new Date() } },
	];

	let finalSkip = skip || (limit || 50) * ((page || 1) - 1);

	return await announcement
		.find({
			filters: filter,
			projection: get,
		})
		.skip(finalSkip)
		.limit(limit || 50)
		.toArray();
};