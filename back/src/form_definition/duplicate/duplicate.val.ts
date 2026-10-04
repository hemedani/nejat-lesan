import { object, objectIdValidation } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const duplicateValidator = () =>
	object({
		set: object({ _id: objectIdValidation }),
		get: selectStruct("form_definition", 1),
	});
