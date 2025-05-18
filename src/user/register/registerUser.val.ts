import { object } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { is_valid_national_number_struct, mobile_pattern } from "@model";

export const registerUserValidator = () => {
	return object({
		set: object({
			mobile: mobile_pattern,
			national_number: is_valid_national_number_struct,
		}),
		get: selectStruct("user", 1),
	});
};
