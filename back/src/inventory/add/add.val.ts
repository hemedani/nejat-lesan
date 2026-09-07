import { number, object, objectIdValidation, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const addValidator = () => {
	return object({
		set: object({
			unitId: objectIdValidation,
			wareId: objectIdValidation,
			quantity: optional(number()),
			min_quantity: optional(number()),
			max_quantity: optional(number()),
			batch_no: optional(string()),
			expiration_date: optional(string()),
			location: optional(string()),
			warehouseUnitId: optional(objectIdValidation),
		}),
		get: selectStruct("inventory", 1),
	});
};
