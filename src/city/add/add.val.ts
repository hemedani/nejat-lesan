import { boolean, object, objectIdValidation } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { city_pure } from "@model";

export const addValidator = () => {
	return object({
		set: object({
			...city_pure,
			provinceId: objectIdValidation,
			isCenter: boolean(),
		}),
		get: selectStruct("city", 1),
	});
};
