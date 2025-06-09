import {
	boolean,
	coerce,
	date,
	defaulted,
	object,
	objectIdValidation,
	optional,
	string,
} from "@deps";
import { selectStruct } from "../../../mod.ts";
import {
	is_valid_national_number_struct,
	mobile_pattern,
	user_genders,
	user_level_emums,
} from "@model";

export const addUserValidator = () => {
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
			summary: optional(string()),

			// شماره ملی
			national_number: is_valid_national_number_struct,
			address: string(),

			level: user_level_emums,
			is_verified: defaulted(boolean(), false),
			nationalCard: optional(objectIdValidation),
			avatar: optional(objectIdValidation),
		}),
		get: selectStruct("user", 1),
	});
};
