import { enums, object } from "@deps";
import { is_valid_national_number_struct, mobile_pattern } from "@model";

export const changeMobileValidator = () => {
	return object({
		set: object({
			national_number: is_valid_national_number_struct,
			mobile: mobile_pattern,
		}),
		get: object({
			mobile: enums([1]),
			national_number: enums([1]),
		}),
	});
};
