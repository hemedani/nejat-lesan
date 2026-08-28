import type { ActFn, Document } from "@deps";
import { ObjectId } from "@deps";
import { shift, user } from "../../../mod.ts";
import { normalizePagination } from "../../patrol_shared/guards.ts";

export const getPatrolOfficersFn: ActFn = async (body) => {
	const {
		set: { page, limit, is_active, search },
		get,
	} = body.details;

	const { skip, limit: safeLimit } = normalizePagination(page, limit);

	const match: Record<string, any> = { level: "Patrol" };
	is_active !== undefined && (match["is_active"] = is_active);
	if (search) {
		const regex = { $regex: new RegExp(search, "i") };
		match["$or"] = [
			{ first_name: regex },
			{ last_name: regex },
			{ personnel_code: regex },
		];
	}

	const officers = await user
		.find({
			filters: match as Document,
			projection: get as any,
		})
		.sort({ _id: -1 })
		.skip(skip)
		.limit(safeLimit)
		.toArray();

	if (officers.length === 0) return [];

	const officerIds = officers.map((o: any) => o._id);
	const activeShifts = await shift
		.find({
			filters: {
				status: "active",
				"officer._id": { $in: officerIds },
			},
			projection: {
				_id: 1,
				shift_type: 1,
				status: 1,
				start_at: 1,
				end_at: 1,
				patrol_unit: { _id: 1, code: 1, name: 1 },
				vehicle: { _id: 1, plaque_no: 1 },
				"officer._id": 1,
			},
		})
		.toArray();

	const shiftMap = new Map<string, any>();
	for (const s of activeShifts as any[]) {
		shiftMap.set(s.officer?._id?.toString(), {
			_id: s._id,
			shift_type: s.shift_type,
			status: s.status,
			start_at: s.start_at,
			end_at: s.end_at,
			patrol_unit: s.patrol_unit ?? null,
			vehicle: s.vehicle ?? null,
		});
	}

	return officers.map((officer: any) => ({
		...officer,
		active_shift: shiftMap.get(officer._id.toString()) ?? null,
	}));
};
