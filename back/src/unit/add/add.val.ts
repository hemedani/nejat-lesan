import { object, objectIdValidation, optional } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { unit_pure } from "@model";

export const addValidator = () => {
	return object({
		set: object({
			...unit_pure,
			organizationId: objectIdValidation,
			roadId: optional(objectIdValidation),
			parentUnitId: optional(objectIdValidation),
			headId: optional(objectIdValidation),
		}),
		get: selectStruct("unit", 1),
	});
};
