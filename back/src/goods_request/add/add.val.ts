import { boolean, number, object, objectIdValidation, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const addValidator = () => {
	return object({
		set: object({
			unitId: objectIdValidation,
			wareId: objectIdValidation,
			quantity: number(),
			warehouseUnitId: optional(objectIdValidation),
			priority: optional(boolean()),
			notes: optional(string()),
			origin: optional(string()),
		}),
		get: selectStruct("goods_request", 1),
	});
};
