import { object } from "@deps";
import { coreApp } from "../../../mod.ts";
import { event_pure } from "@model";

export const addValidator = () => {
	return object({
		set: object({
			...event_pure,
		}),
		get: coreApp.schemas.selectStruct("event", 1),
	});
};
