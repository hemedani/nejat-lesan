/**
 * -----------------------------------------------------------------------------
 * FILE: src/accident/add/add.val.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Defines the validation schema for creating a new accident. It separates the
 * pure accident data from the ObjectIDs of its relations.
 */
import { array, object, objectIdValidation, optional } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { accidentSetSchema } from "../accidentSetSchema.ts";

export const addValidator = () => {
	// Reuse the shared all-optional pure schema verbatim. Every field is
	// optional: each organization designs its own registration process
	// (accident_process) and may select any subset of fields — the process,
	// not the server, decides which fields are required for a given type.
	return object({
		set: object({
			// Include all pure fields from the accident schema
			...accidentSetSchema.schema,

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
			incidentSeverityId: optional(objectIdValidation),
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
