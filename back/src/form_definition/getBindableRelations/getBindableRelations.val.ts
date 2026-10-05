import { enums, object, optional } from "@deps";
import { form_definition_kind_emums } from "@model";

/**
 * The builder reads this instead of keeping its own list, which is what let the
 * web list drift 16 models behind the server allow-list.
 *
 * `get` is a want-marker, not a projection — the fn returns the whole payload —
 * so it uses the codebase idiom `enums([0, 1])` rather than declaring the
 * response type, which would reject a client's `1`.
 */
export const getBindableRelationsValidator = () =>
	object({
		set: object({ formKind: optional(form_definition_kind_emums) }),
		get: object({
			formKind: optional(enums([0, 1])),
			relations: optional(enums([0, 1])),
		}),
	});
