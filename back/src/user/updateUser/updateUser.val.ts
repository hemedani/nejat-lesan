import {
	coerce,
	date,
	object,
	objectIdValidation,
	optional,
	string,
} from "@deps";
import { selectStruct } from "../../../mod.ts";
import { user_genders } from "@model";

export const updateUserValidator = () => {
	return object({
		set: object({
			_id: objectIdValidation,
			first_name: optional(string()),
			last_name: optional(string()),
			father_name: optional(string()),
			gender: optional(user_genders),
			birth_date: optional(
				coerce(date(), string(), (value) => new Date(value)),
			),
			summary: optional(string()),

			address: optional(string()),
		}),
		get: selectStruct("user", 1),
	});
};
