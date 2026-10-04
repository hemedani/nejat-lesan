import {
	array,
	boolean,
	coerce,
	date,
	enums,
	number,
	object,
	objectIdValidation,
	optional,
	string,
} from "@deps";
import { geoJSONStruct, incident_report_dynamic_answer_struct } from "@model";
import { RELATION_SET_KEYS } from "./relations.ts";

/**
 * Shared, all-optional `set` schema for the non-accident report body.
 *
 * All-optional is deliberate: the organization designs its own form and the form
 * decides which questions are required, so the server has no field to require.
 * `validate` on the definition is what enforces completeness — and it runs the
 * same shared engine the officer's device ran.
 */
export const incident_report_pure_set = {
	// Which form produced this report. The form is the only classification.
	form_definition_id: objectIdValidation,

	// Identity / idempotency
	client_report_uuid: optional(string()),
	serial: optional(number()),
	report_id: optional(string()),
	reported_at: optional(coerce(date(), string(), (value) => new Date(value))),
	occurred_at: optional(coerce(date(), string(), (value) => new Date(value))),

	// Sync lifecycle
	sync_status: optional(
		enums(["draft", "queued", "syncing", "synced", "rejected"]),
	),
	rejection_reason: optional(string()),

	// Managerial review — written by the review acts, never by the app.
	review_status: optional(
		enums([
			"submitted",
			"under_review",
			"returned",
			"approved",
			"completed",
		]),
	),
	review_reason: optional(string()),
	reviewed_at: optional(coerce(date(), string(), (value) => new Date(value))),
	completed_at: optional(
		coerce(date(), string(), (value) => new Date(value)),
	),

	// The report
	description: optional(string()),
	is_hazard: optional(boolean()),
	needs_repair: optional(boolean()),
	follow_up_required: optional(boolean()),
	temporary_action: optional(string()),

	// Form answers
	form_answers: optional(object({})),
	dynamic_answers: optional(array(incident_report_dynamic_answer_struct)),
	form_version: optional(number()),

	// Capture context
	location: optional(geoJSONStruct("Point")),
	gps_coords: optional(geoJSONStruct("Point")),
	gps_accuracy: optional(number()),
	travel_direction: optional(string()),
	kilometer: optional(number()),
	meter: optional(number()),
};

/** Single-valued relation ids accepted by both `add` and `update`. */
const singleRelationSchema = {
	officerId: optional(objectIdValidation),
	patrolUnitId: optional(objectIdValidation),
	vehicleId: optional(objectIdValidation),
	policeStationId: optional(objectIdValidation),
	provinceId: optional(objectIdValidation),
	cityId: optional(objectIdValidation),
	roadId: optional(objectIdValidation),
	trafficZoneId: optional(objectIdValidation),
	cityZoneId: optional(objectIdValidation),
	positionId: optional(objectIdValidation),
	incidentSeverityId: optional(objectIdValidation),
	lightStatusId: optional(objectIdValidation),
	roadSituationId: optional(objectIdValidation),
	shoulderStatusId: optional(objectIdValidation),
};

/** Multi-valued relation ids accepted by both `add` and `update`. */
const multiRelationSchema = {
	roadDefectsIds: optional(array(objectIdValidation)),
	equipmentDamagesIds: optional(array(objectIdValidation)),
	airStatusesIds: optional(array(objectIdValidation)),
	roadSurfaceConditionsIds: optional(array(objectIdValidation)),
};

export const incident_report_set_schema = {
	...incident_report_pure_set,
	...singleRelationSchema,
	...multiRelationSchema,
};

export const incident_report_relation_set_keys = RELATION_SET_KEYS;
