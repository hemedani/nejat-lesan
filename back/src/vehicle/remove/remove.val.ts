import { enums, object, optional, string } from "@deps";

export const removeVehicleValidator = () => {
	return object({
		set: object({
			_id: string(),
		}),
		get: object({
			success: optional(enums([0, 1])),
		}),
	});
};
