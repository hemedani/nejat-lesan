import { object, objectIdValidation } from "@deps";
import { coreApp } from "../../../mod.ts";

export const getValidator = () => {
	return object({
		set: object({
			_id: objectIdValidation,
		}),
		get: coreApp.schemas.selectStruct("event", 1),
	});
};
