import { object, objectIdValidation, optional } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { police_station_pure } from "@model";

export const addValidator = () => {
	return object({
		set: object({
			...police_station_pure,
			commanderId: optional(objectIdValidation),
		}),
		get: selectStruct("police_station", 1),
	});
};
