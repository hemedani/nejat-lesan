import { enums, object } from "@deps";
import { is_valid_national_number_struct } from "@model";

export const loginUserReqValidator = () => {
	return object({
		set: object({
			national_number: is_valid_national_number_struct,
		}),
		get: object({
			mobile: enums([1]),
			national_number: enums([1]),
		}),
	});
};
