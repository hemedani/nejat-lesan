import {
	array,
	number,
	object,
	objectIdValidation,
	optional,
	string,
} from "@deps";
import { selectStruct } from "../../../mod.ts";

export const getsValidator = () => {
	return object({
		set: object({
			page: number(),
			limit: number(),
			name: optional(string()),
			cities: optional(array(objectIdValidation)),
			cityNames: optional(array(string())),
		}),
		get: selectStruct("city_zone", 2),
	});
};
