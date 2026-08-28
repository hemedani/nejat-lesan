import { object, string } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const getEmergencyValidator = () => {
	return object({
		set: object({
			_id: string(),
		}),
		get: selectStruct("emergency", 1),
	});
};
