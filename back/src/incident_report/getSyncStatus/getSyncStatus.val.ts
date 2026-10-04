import { object, objectIdValidation, optional } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const getSyncStatusValidator = () =>
	object({
		set: object({ userId: optional(objectIdValidation) }),
		get: selectStruct("incident_report", 1),
	});
