import { object, objectIdValidation } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const getValidator = () =>
	object({
		set: object({ _id: objectIdValidation }),
		get: selectStruct("incident_report", 1),
	});
