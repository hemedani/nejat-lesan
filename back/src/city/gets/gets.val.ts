import {
	array,
	number,
	object,
	objectIdValidation,
	optional,
	string,
} from "@deps";
import { selectStruct } from "../../../mod.ts";

export const getsValidator = () => {
	return object({
		set: object({
			page: number(),
			limit: number(),
			name: optional(string()),
			provinceIds: optional(array(objectIdValidation)),
			_ids: optional(array(objectIdValidation)),
		}),
		get: selectStruct("city", 2),
	});
};
