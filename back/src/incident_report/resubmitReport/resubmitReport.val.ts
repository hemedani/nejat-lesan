import { object, objectIdValidation } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const resubmitReportValidator = () =>
	object({
		set: object({ reportId: objectIdValidation }),
		get: selectStruct("incident_report", 2),
	});
