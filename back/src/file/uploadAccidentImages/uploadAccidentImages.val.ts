import { object, objectIdValidation, optional, array, string, number } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const uploadAccidentImagesValidator = () => {
	return object({
		set: object({
			category: string(), // plate, insurance, croquis, facility_damage, other
			accidentId: optional(objectIdValidation),
			sequence: optional(number()),
			file: object({}), // File object from formData
		}),
		get: selectStruct("file", 1),
	});
};