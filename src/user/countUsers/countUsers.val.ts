import { enums, object, optional } from "@deps";
import { user_level_emums } from "@model";

export const countUsersValidator = () => {
	return object({
		set: object({
			levels: optional(user_level_emums),
		}),
		get: object({
			qty: enums([0, 1]),
		}),
	});
};
