import { enums, object, objectIdValidation, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const reviewReportValidator = () =>
	object({
		set: object({
			reportId: objectIdValidation,
			action: enums(["start_review", "return", "approve", "complete"]),
			reason: optional(string()),
		}),
		get: selectStruct("accident", 2),
	});
