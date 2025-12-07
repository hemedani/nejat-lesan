import { array, object, string } from "@deps";
import { coreApp } from "../../../mod.ts";

export const addValidator = () => {
	return object({
		set: object({
			name: string(),
			description: string(),
			dates: array(array(string())), // Array of date ranges [[startDate, endDate], [startDate, endDate], ...]
		}),
		get: coreApp.schemas.selectStruct("event", 1),
	});
};
