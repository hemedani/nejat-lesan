import { enums, object, optional } from "@deps";

export const getReferenceModelsValidator = () =>
	object({
		set: object({}),
		// Want-marker, not a projection: the fn returns the whole payload, so the
		// codebase idiom `enums([0, 1])` is what keeps a client's `1` valid.
		get: object({ models: optional(enums([0, 1])) }),
	});
