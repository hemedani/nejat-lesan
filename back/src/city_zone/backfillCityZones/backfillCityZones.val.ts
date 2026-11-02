import {
	boolean,
	enums,
	number,
	object,
	objectIdValidation,
	optional,
} from "@deps";

export const backfillCityZonesValidator = () => {
	return object({
		set: object({
			model: optional(enums(["accident", "incident_report", "both"])),
			cityId: optional(objectIdValidation),
			limit: optional(number()),
			dryRun: optional(boolean()),
		}),
		get: object({
			summary: enums([1]),
		}),
	});
};
