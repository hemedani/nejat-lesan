import { number, object, objectIdValidation, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { form_definition_kind_emums } from "@model";

export const getsValidator = () =>
	object({
		set: object({
			page: optional(number()),
			limit: optional(number()),
			skip: optional(number()),
			organizationId: optional(objectIdValidation),
			status: optional(string()),
			form_kind: optional(form_definition_kind_emums),
			search: optional(string()),
		}),
		get: selectStruct("form_definition", 1),
	});
