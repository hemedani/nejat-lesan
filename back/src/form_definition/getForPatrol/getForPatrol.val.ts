import { object, objectIdValidation, optional } from "@deps";
import { form_definition_kind_emums } from "@model";

export const getForPatrolValidator = () =>
	object({
		set: object({
			/** Which kind of report is being filed. */
			formKind: optional(form_definition_kind_emums),
			orgId: optional(objectIdValidation),
			/** Re-validate a draft against a specific definition version. */
			definitionId: optional(objectIdValidation),
		}),
		get: object({
			form: optional(object({})),
			options: optional(object({})),
			version: optional(object({})),
		}),
	});
