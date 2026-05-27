import { enums, number, object, optional } from "@deps";

export const getCreatedAtPeriodsValidator = () => {
	return object({
		set: object({
			intervalMinutes: optional(number()),
		}),
		get: object({
			periods: optional(enums([0, 1])),
		}),
	});
};
