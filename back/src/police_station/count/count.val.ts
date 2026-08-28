import { number, object, optional, string } from "@deps";

export const countValidator = () => {
	return object({
		set: object({
			name: optional(string()),
		}),
		get: object({ qty: optional(number()) }),
	});
};
