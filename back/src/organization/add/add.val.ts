import { object, objectIdValidation, optional } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { organization_pure } from "@model";

export const addValidator = () => {
	return object({
		set: object({
			...organization_pure,
			roadId: optional(objectIdValidation),
			headId: optional(objectIdValidation),
			logoId: optional(objectIdValidation),
		}),
		get: selectStruct("organization", 1),
	});
};
