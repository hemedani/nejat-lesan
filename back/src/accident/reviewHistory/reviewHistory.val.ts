import { number, object, objectIdValidation, optional } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const reviewHistoryValidator = () => object({
	set: object({
		reportId: objectIdValidation,
		page: optional(number()),
		limit: optional(number()),
	}),
	get: selectStruct("accident_review", 2),
});
