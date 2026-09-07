import { number, object, objectIdValidation, optional } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { stock_movement_reason_emums } from "@model";

export const getsValidator = () => {
	return object({
		set: object({
			page: optional(number()),
			limit: optional(number()),
			skip: optional(number()),
			unitId: optional(objectIdValidation),
			wareId: optional(objectIdValidation),
			reason: optional(stock_movement_reason_emums),
		}),
		get: selectStruct("stock_movement", 1),
	});
};
