import {
	array,
	boolean,
	coerce,
	date,
	number,
	object,
	objectIdValidation,
	optional,
	string,
} from "@deps";
import { selectStruct } from "../../../mod.ts";
import { goods_receipt_item_struct } from "@model";

export const addValidator = () => {
	return object({
		set: object({
			receivingUnitId: objectIdValidation,
			received_at: optional(string()),
			notes: optional(string()),
			items: array(goods_receipt_item_struct),
			// JIT: cross-dock → کالا مستقیم به واحد هدف صادر می‌شود (بدون توقف در انبار)
			cross_dock: optional(boolean()),
			targetUnitId: optional(objectIdValidation),
		}),
		get: selectStruct("goods_receipt", 1),
	});
};
