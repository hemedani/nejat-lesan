import { object, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";
import {
	emailPattern,
	is_valid_national_number_struct,
	mobile_pattern,
} from "@model";

export const tempUserValidator = () => {
	return object({
		set: object({
			first_name: string(),
			last_name: string(),
			father_name: string(),
			mobile: mobile_pattern,
			email: emailPattern,
			national_number: optional(is_valid_national_number_struct),
		}),
		get: selectStruct("user", 1),
	});
};
