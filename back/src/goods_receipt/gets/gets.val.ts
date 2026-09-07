import { number, object, objectIdValidation, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { goods_receipt_status_emums } from "@model";

export const getsValidator = () => {
	return object({
		set: object({
			page: optional(number()),
			limit: optional(number()),
			skip: optional(number()),
			unitId: optional(objectIdValidation),
			status: optional(goods_receipt_status_emums),
		}),
		get: selectStruct("goods_receipt", 1),
	});
};
