import { object, objectIdValidation, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { form_definition_kind_emums, form_definition_struct } from "@model";

/**
 * The builder saves the whole draft at once, so `definition` replaces the stored
 * tree wholesale rather than being deep-merged. Nodes the author deleted must
 * actually disappear.
 *
 * Every field is optional and `update` runs a plain `assert`, so the definition
 * structs use `optional()` (not `defaulted()`) — a defaulted field would validate
 * on `add` and then fail here with the identical document.
 */
export const updateValidator = () =>
	object({
		set: object({
			_id: objectIdValidation,
			name: optional(string()),
			description: optional(string()),
			form_kind: optional(form_definition_kind_emums),
			icon: optional(string()),
			definition: optional(form_definition_struct),
		}),
		get: selectStruct("form_definition", 1),
	});
