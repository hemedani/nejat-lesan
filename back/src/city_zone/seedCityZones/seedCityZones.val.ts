/**
 * -----------------------------------------------------------------------------
 * FILE: seedCityZones.val.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * A simple validator for the seeding function. It doesn't require any input
 * but is included for consistency.
 */
import { enums, object, objectIdValidation } from "@deps";

export const seedCityZonesValidator = () => {
	return object({
		set: object({ cityId: objectIdValidation, geoId: objectIdValidation }),
		get: object({
			summary: enums([1]),
		}),
	});
};
