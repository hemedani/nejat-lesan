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
			_ids: optional(array(objectIdValidation)),
		}),
		get: selectStruct("province", 2),
	});
};
