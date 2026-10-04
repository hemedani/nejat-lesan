import { array, object, objectIdValidation, optional, string } from "@deps";

/**
 * Fetch the `{ _id, name }` options for a reference model.
 *
 * The builder needs this to populate a `reference` field's option list while
 * authoring, and the admin accident pages need it to render the same choices.
 * Callers must pass a model name from `REFERENCE_MODEL_NAMES` — the allow-list
 * exists so this act cannot be used to enumerate arbitrary collections.
 */
export const getReferenceOptionsValidator = () =>
	object({
		set: object({
			model: string(),
			ids: optional(array(objectIdValidation)),
			search: optional(string()),
			limit: optional(string()),
		}),
		get: object({
			model: optional(string()),
			items: optional(object({})),
		}),
	});
