import { number, object, objectIdValidation, optional } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { goods_request_status_emums } from "@model";

export const getsValidator = () => {
	return object({
		set: object({
			page: optional(number()),
			limit: optional(number()),
			skip: optional(number()),
			unitId: optional(objectIdValidation),
			warehouseUnitId: optional(objectIdValidation),
			wareId: optional(objectIdValidation),
			status: optional(goods_request_status_emums),
		}),
		get: selectStruct("goods_request", 1),
	});
};
