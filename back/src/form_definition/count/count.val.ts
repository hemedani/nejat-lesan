import { number, object, objectIdValidation, optional, string } from "@deps";
import { form_definition_kind_emums } from "@model";

export const countValidator = () =>
	object({
		set: object({
			organizationId: optional(objectIdValidation),
			status: optional(string()),
			form_kind: optional(form_definition_kind_emums),
		}),
		get: object({ qty: optional(number()) }),
	});
