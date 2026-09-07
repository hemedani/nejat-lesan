import { number, object, optional, string } from "@deps";

export const countValidator = () => {
	return object({
		set: object({
			search: optional(string()),
			ware_type: optional(string()),
		}),
		get: object({ qty: optional(number()) }),
	});
};
