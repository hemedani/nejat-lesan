import {
	enums,
	number,
	object,
	objectIdValidation,
	optional,
	string,
} from "@deps";
import { user_level_emums } from "@model";

export const countUsersValidator = () => {
	return object({
		set: object({
			levels: optional(user_level_emums),
			organizationId: optional(objectIdValidation),
			search: optional(string()),
		}),
		get: object({
			qty: enums([0, 1]),
		}),
	});
};
