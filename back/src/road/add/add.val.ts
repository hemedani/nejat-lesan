import { object, objectIdValidation } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { road_pure } from "@model";

export const addValidator = () => {
	return object({
		set: object({
			...road_pure,
			provinceId: objectIdValidation,
		}),
		get: selectStruct("road", 1),
	});
};
