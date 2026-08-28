import { number, object } from "@deps";

export const getUnreadCountValidator = () => {
	return object({
		set: object({}),
		get: object({
			count: number(),
		}),
	});
};
