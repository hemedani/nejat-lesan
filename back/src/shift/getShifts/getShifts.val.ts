import { number, object, objectIdValidation, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const getShiftsValidator = () => {
	return object({
		set: object({
			userId: optional(objectIdValidation),
			page: number(),
			limit: number(),
			status: optional(string()),
		}),
		get: selectStruct("shift", 2),
	});
};