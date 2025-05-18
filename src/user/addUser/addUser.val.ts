import { object } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { user_pure } from "@model";

export const addUserValidator = () => {
	return object({
		set: object({ ...user_pure }),
		get: selectStruct("user", 1),
	});
};
