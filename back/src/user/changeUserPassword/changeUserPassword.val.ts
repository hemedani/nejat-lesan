import { object, objectIdValidation, size, string } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const changeUserPasswordValidator = () => {
	return object({
		set: object({
			userId: objectIdValidation,
			newPassword: size(string(), 8, 100),
		}),
		get: selectStruct("user", 1),
	});
};
