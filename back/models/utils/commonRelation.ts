import { object, objectIdValidation, string } from "@deps";

export const common_relation_struct = object({
	_id: objectIdValidation,
	name: string(),
});
