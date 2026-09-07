import { enums, object, objectIdValidation, optional, string } from "@deps";

export const getOrgChartValidator = () => {
	return object({
		set: object({
			// Manager/Ghost باید orgId بفرستند؛ بقیه نقش‌ها از scope نقش حل می‌شوند.
			orgId: optional(objectIdValidation),
			activeRoleId: optional(string()),
		}),
		get: object({
			units: optional(enums([0, 1])),
			organization: optional(enums([0, 1])),
			stats: optional(enums([0, 1])),
		}),
	});
};
