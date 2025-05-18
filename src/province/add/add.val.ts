import { object } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { province_pure } from "@model";

export const addValidator = () => {
	return object({
		set: object({
			...province_pure,
		}),
		get: selectStruct("province", 1),
	});
};
