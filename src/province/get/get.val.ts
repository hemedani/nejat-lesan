import { object, string } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const getValidator = () => {
	return object({
		set: object({
			_id: string(),
		}),
		get: selectStruct("province", 2),
	});
};
