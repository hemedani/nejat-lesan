import { object, objectIdValidation } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { axes_pure } from "@model";

export const addValidator = () => {
	return object({
		set: object({
			...axes_pure,
			provinceId: objectIdValidation,
		}),
		get: selectStruct("axes", 1),
	});
};
