import { enums, object } from "@deps";

export const getQuestionModelsValidator = () => {
	return object({
		set: object({}),
		get: object({
			models: enums([0, 1]),
		}),
	});
};
