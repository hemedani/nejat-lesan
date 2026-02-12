import { object } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { shared_relation_pure } from "@model";

export const addValidator = () => {
	return object({
		set: object({
			...shared_relation_pure,
		}),
		get: selectStruct("body_insurance_co", 1),
	});
};
