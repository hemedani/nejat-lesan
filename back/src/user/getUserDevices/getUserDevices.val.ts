import { object, objectIdValidation } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const getUserDevicesValidator = () => {
	return object({
		set: object({
			userId: objectIdValidation,
		}),
		get: selectStruct("device", 1),
	});
};