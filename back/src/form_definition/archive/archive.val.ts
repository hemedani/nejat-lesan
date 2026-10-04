import { object, objectIdValidation, optional } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const archiveValidator = () =>
	object({
		set: object({ _id: objectIdValidation }),
		get: selectStruct("form_definition", 1),
	});
