import { number, object } from "@deps";

/**
 * پاسخ این اکشن مستقل از «get» و پایدار است:
 * {
 *   patrolUsers: { total, active },
 *   patrolUnits: { total, active },
 *   vehicles:    { total, active, assigned },
 *   shifts:      { active, endedToday }
 * }
 */
export const getOperationsSummaryValidator = () => {
	return object({
		set: object({}),
		get: object({
			patrolUsers: object({
				total: number(),
				active: number(),
			}),
			patrolUnits: object({
				total: number(),
				active: number(),
			}),
			vehicles: object({
				total: number(),
				active: number(),
				assigned: number(),
			}),
			shifts: object({
				active: number(),
				endedToday: number(),
			}),
		}),
	});
};
