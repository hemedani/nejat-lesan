import { number, object, optional } from "@deps";
import { coreApp } from "../../../mod.ts";

export const countValidator = () => {
	return object({
		set: object({
			filters: optional(object({})),
		}),
		get: object({
			count: number(),
		}),
	});
};
