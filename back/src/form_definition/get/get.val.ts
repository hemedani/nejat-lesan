import { object, objectIdValidation, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const getValidator = () =>
	object({
		set: object({
			_id: string(),
			// Optional; non-global callers are pinned to their own organization.
			organizationId: optional(objectIdValidation),
		}),
		get: selectStruct("form_definition", 1),
	});
