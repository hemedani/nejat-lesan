import { number, object, objectIdValidation } from "@deps";

export const transferValidator = () => {
	return object({
		set: object({
			fromUnitId: objectIdValidation,
			toUnitId: objectIdValidation,
			wareId: objectIdValidation,
			quantity: number(),
		}),
		get: object({}),
	});
};
