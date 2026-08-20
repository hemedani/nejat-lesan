import { coerce, date, object, optional, size, string } from "@deps";
import { selectStruct } from "../../../mod.ts";
import {
	emailPattern,
	is_valid_national_number_struct,
	mobile_pattern,
	user_genders,
} from "@model";

export const registerUserValidator = () => {
	return object({
		set: object({
			first_name: string(),
			last_name: string(),
			father_name: string(),
			mobile: mobile_pattern,
			gender: user_genders,
			birth_date: optional(
				coerce(date(), string(), (value) => new Date(value)),
			),
			email: emailPattern,
			password: size(string(), 8, 100),
			national_number: optional(is_valid_national_number_struct),
		}),
		get: selectStruct("user", 1),
	});
};
