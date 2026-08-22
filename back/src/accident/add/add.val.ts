/**
 * -----------------------------------------------------------------------------
 * FILE: src/accident/add/add.val.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Defines the validation schema for creating a new accident. It separates the
 * pure accident data from the ObjectIDs of its relations.
 */
import { array, coerce, date, object, objectIdValidation, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { geoJSONStruct } from "@model";
import { accidentSetSchema } from "../accidentSetSchema.ts";

export const addValidator = () => {
	// Reuse the shared all-optional pure schema, but keep `location` and
	// `date_of_accident` required for creation.
	const optionalPureAccident = {
		...accidentSetSchema.schema,
		location: geoJSONStruct("Point"),
		date_of_accident: coerce(date(), string(), (value: string) =>
			new Date(value)
		),
	};

	return object({
		set: object({
			// Include all pure fields from the accident schema
			...optionalPureAccident,

			// --- IDs for Relational Fields ---
			// Single Relations
			officerId: optional(objectIdValidation),
			patrolUnitId: optional(objectIdValidation),
			vehicleId: optional(objectIdValidation),
			laneId: optional(objectIdValidation),
			policeStationId: optional(objectIdValidation),
			croquisTypeId: optional(objectIdValidation),
			provinceId: optional(objectIdValidation),
			cityId: optional(objectIdValidation),
			roadId: optional(objectIdValidation),
			trafficZoneId: optional(objectIdValidation),
			cityZoneId: optional(objectIdValidation),
			typeId: optional(objectIdValidation),
			positionId: optional(objectIdValidation),
			rulingTypeId: optional(objectIdValidation),
			lightStatusId: optional(objectIdValidation),
			collisionTypeId: optional(objectIdValidation),
			roadSituationId: optional(objectIdValidation),
			roadRepairTypeId: optional(objectIdValidation),
			shoulderStatusId: optional(objectIdValidation),

			// Multiple Relations
			areaUsagesIds: optional(array(objectIdValidation)),
			airStatusesIds: optional(array(objectIdValidation)),
			roadDefectsIds: optional(array(objectIdValidation)),
			humanReasonsIds: optional(array(objectIdValidation)),
			vehicleReasonsIds: optional(array(objectIdValidation)),
			equipmentDamagesIds: optional(array(objectIdValidation)),
			roadSurfaceConditionsIds: optional(array(objectIdValidation)),
			attachmentsIds: optional(array(objectIdValidation)),
		}),
		get: selectStruct("accident", 1),
	});
};