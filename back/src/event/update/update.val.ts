import { array, object, objectIdValidation, optional, string } from "@deps";
import { coreApp } from "../../../mod.ts";

export const updateValidator = () => {
	return object({
		set: object({
			_id: objectIdValidation,
			name: optional(string()),
			description: optional(string()),
			dates: optional(array(object({
				from: string(),
				to: string(),
				startEntireRange: string(),
				endEntireRange: string(),
			}))), // Array of date ranges [[startDate, endDate], [startDate, endDate], ...]
		}),
		get: coreApp.schemas.selectStruct("event", 1),
	});
};
