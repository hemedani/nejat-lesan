import { object, objectIdValidation, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { form_definition_kind_emums, form_definition_struct } from "@model";

export const addValidator = () =>
	object({
		set: object({
			organizationId: objectIdValidation,
			name: string(),
			description: optional(string()),
			form_kind: optional(form_definition_kind_emums),
			icon: optional(string()),
			definition: optional(form_definition_struct),
		}),
		get: selectStruct("form_definition", 1),
	});
