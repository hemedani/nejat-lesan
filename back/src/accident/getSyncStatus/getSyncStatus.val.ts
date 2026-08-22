import { object, objectIdValidation, optional } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const getSyncStatusValidator = () => {
	return object({
		set: object({
			userId: optional(objectIdValidation),
		}),
		get: selectStruct("accident", 1),
	});
};