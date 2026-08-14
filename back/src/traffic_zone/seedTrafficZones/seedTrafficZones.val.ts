/**
 * -----------------------------------------------------------------------------
 * FILE: seedTrafficZones.val.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Validator for the seeding function. Requires the target City and the uploaded
 * GeoJSON file (geoId), and returns a summary object.
 */
import { enums, object, objectIdValidation } from "@deps";

export const seedTrafficZonesValidator = () => {
	return object({
		set: object({ cityId: objectIdValidation, geoId: objectIdValidation }),
		get: object({
			summary: enums([1]),
		}),
	});
};
