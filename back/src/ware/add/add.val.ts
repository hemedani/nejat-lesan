import { object } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { ware_pure } from "@model";

export const addValidator = () => {
	return object({
		set: object({
			...ware_pure,
		}),
		get: selectStruct("ware", 1),
	});
};
