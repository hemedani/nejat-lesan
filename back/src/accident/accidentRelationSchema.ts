import { array, object, objectIdValidation, optional } from "@deps";

/**
 * Shared, all-optional relation-id `set` fields for the accident write acts.
 *
 * `accident.add` and `accident.update` must accept the *same* relation payload:
 * the mobile correction flow re-sends the whole report (pure fields + relation
 * ids) through `accident.update`, and the validator rejects undeclared keys
 * outright (superstruct `object()` yields unknown keys as `never`). Keeping the
 * list in one place is what stops the two validators from drifting apart.
 */
export const accidentRelationSetSchema = object({
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
});
