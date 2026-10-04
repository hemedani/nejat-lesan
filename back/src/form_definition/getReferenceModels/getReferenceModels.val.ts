import { object, optional, string } from "@deps";

export const getReferenceModelsValidator = () =>
	object({
		set: object({}),
		get: object({ models: optional(object({})) }),
	});
