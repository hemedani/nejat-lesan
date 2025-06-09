import { object } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { traffic_zone_pure } from "@model";

export const addValidator = () => {
	return object({
		set: object({
			...traffic_zone_pure,
		}),
		get: selectStruct("traffic_zone", 1),
	});
};
