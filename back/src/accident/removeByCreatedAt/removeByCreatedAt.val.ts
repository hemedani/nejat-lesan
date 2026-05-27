import { number, object, optional } from "@deps";

export const removeByCreatedAtValidator = () => {
	return object({
		set: object({
			createdAt: number(),
			hoursBefore: optional(number()),
			hoursAfter: optional(number()),
		}),
		get: object({
			success: optional(number()),
			deletedCount: optional(number()),
		}),
	});
};
