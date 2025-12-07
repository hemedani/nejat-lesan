import { number, object, optional } from "@deps";
import { coreApp } from "../../../mod.ts";

export const getsValidator = () => {
	return object({
		set: object({
			page: number(),
			limit: number(),
			skip: optional(number()),
		}),
		get: coreApp.schemas.selectStruct("event", 1),
	});
};
