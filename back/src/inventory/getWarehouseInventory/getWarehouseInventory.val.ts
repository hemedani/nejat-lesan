import { enums, object, objectIdValidation, optional } from "@deps";

export const getWarehouseInventoryValidator = () => {
	return object({
		set: object({
			unitId: objectIdValidation,
		}),
		get: object({
			rows: optional(enums([0, 1])),
		}),
	});
};
