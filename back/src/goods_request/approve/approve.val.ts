import { boolean, object, objectIdValidation, optional } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const approveValidator = () => {
	return object({
		set: object({
			_id: objectIdValidation,
			approve: optional(boolean()),
		}),
		get: selectStruct("goods_request", 1),
	});
};
