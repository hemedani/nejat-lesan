import { object } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const setGhostPasswordValidator = () => {
	return object({
		set: object({}),
		get: selectStruct("user", 1),
	});
};
