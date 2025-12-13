import { number, object, optional, string } from "@deps";
import { coreApp } from "../../../mod.ts";

export const getsValidator = () => {
	return object({
		set: object({
			page: number(),
			limit: number(),
			skip: optional(number()),
			name: optional(string()),
		}),
		get: coreApp.schemas.selectStruct("event", 1),
	});
};
