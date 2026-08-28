import type { ActFn } from "@deps";
import { patrol_unit, shift, user, vehicle } from "../../../mod.ts";

const startOfToday = () => {
	const now = new Date();
	now.setHours(0, 0, 0, 0);
	return now;
};

export const getOperationsSummaryFn: ActFn = async () => {
	const [
		patrolUsersTotal,
		patrolUsersActive,
		patrolUnitsTotal,
		patrolUnitsActive,
		vehiclesTotal,
		vehiclesActive,
		vehiclesAssigned,
		shiftsActive,
		shiftsEndedToday,
	] = await Promise.all([
		user.countDocument({ filter: { level: "Patrol" } }),
		user.countDocument({ filter: { level: "Patrol", is_active: true } }),
		patrol_unit.countDocument({ filter: {} }),
		patrol_unit.countDocument({ filter: { is_active: true } }),
		vehicle.countDocument({ filter: {} }),
		vehicle.countDocument({ filter: { is_active: true } }),
		vehicle.countDocument({
			filter: { "patrol_unit._id": { $exists: true, $ne: null } },
		}),
		shift.countDocument({ filter: { status: "active" } }),
		shift.countDocument({
			filter: {
				status: "ended",
				end_at: {
					$gte: startOfToday(),
					$lte: new Date(),
				},
			},
		}),
	]);

	return {
		patrolUsers: {
			total: patrolUsersTotal,
			active: patrolUsersActive,
		},
		patrolUnits: {
			total: patrolUnitsTotal,
			active: patrolUnitsActive,
		},
		vehicles: {
			total: vehiclesTotal,
			active: vehiclesActive,
			assigned: vehiclesAssigned,
		},
		shifts: {
			active: shiftsActive,
			endedToday: shiftsEndedToday,
		},
	};
};
