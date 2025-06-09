import { enums, object, optional, size, string } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { is_valid_national_number_struct } from "@model";

export const loginUserValidator = () => {
	return object({
		set: object({
			national_number: is_valid_national_number_struct,
			code: size(string(), 5),
		}),
		get: optional(
			object({
				token: optional(enums([0, 1])),
				user: selectStruct("user", 1),
			}),
		),
	});
};
