/**
 * -----------------------------------------------------------------------------
 * FILE: seedTownships.val.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * A simple validator for the seeding function. It doesn't require any input
 * but is included for consistency.
 */
import { enums, object, objectIdValidation } from "@deps";

export const seedTownshipsValidator = () => {
	return object({
		set: object({
			provinceId: objectIdValidation,
			geoId: objectIdValidation,
		}),
		get: object({
			summary: enums([1]),
		}),
	});
};
