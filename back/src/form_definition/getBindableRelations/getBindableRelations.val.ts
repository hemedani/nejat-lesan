import { number, object, optional } from "@deps";
import { form_definition_kind_emums } from "@model";

/**
 * The builder reads this instead of keeping its own list, which is what let the
 * web list drift 16 models behind the server allow-list.
 */
export const getBindableRelationsValidator = () =>
	object({
		set: object({ formKind: optional(form_definition_kind_emums) }),
		get: object({
			formKind: optional(number()),
			relations: optional(object({})),
		}),
	});
