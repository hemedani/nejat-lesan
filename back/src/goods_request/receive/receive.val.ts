import { object, objectIdValidation } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const receiveValidator = () => {
	return object({
		set: object({
			_id: objectIdValidation,
		}),
		get: selectStruct("goods_request", 1),
	});
};
