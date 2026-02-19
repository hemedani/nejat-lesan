import { object, objectIdValidation, optional } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const updateCityRelationsValidator = () => {
	return object({
		set: object({
			_id: objectIdValidation,
			province: optional(objectIdValidation),
		}),
		get: selectStruct("city", 1),
	});
};
