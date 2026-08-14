import { object, objectIdValidation } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { air_pollution_zone_pure } from "@model";

export const addValidator = () => {
	return object({
		set: object({
			...air_pollution_zone_pure,
			cityId: objectIdValidation,
		}),
		get: selectStruct("air_pollution_zone", 1),
	});
};
