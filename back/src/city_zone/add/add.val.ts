import { object, objectIdValidation } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { city_zone_pure } from "@model";

export const addValidator = () => {
	return object({
		set: object({
			...city_zone_pure,
			cityId: objectIdValidation,
		}),
		get: selectStruct("city_zone", 1),
	});
};
