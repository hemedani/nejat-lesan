import { coreApp } from "../mod.ts";
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
	type RelationDataType,
	type RelationSortOrderType,
	string,
} from "@deps";
import { createUpdateAt } from "../utils/createUpdateAt.ts";
import {
	geoJSONStruct,
	road_excludes,
	share_relation_excludes,
	user_excludes,
} from "@model";

/**
 * Reports that are not accidents: road damage, obstructions and hazards, and
 * other events an organization chooses to record.
 *
 * These used to live in `accident` behind an `incident_type` discriminator,
 * which put three problems in one collection:
 *
 * 1. Accident statistics were contaminated. `user.dashboardStatistic`,
 *    `accident.count`, `accident.getCreatedAtPeriods` and `accident.mapAccidents`
 *    all counted the whole collection, so a road-damage report was an "accident"
 *    in the admin dashboard, the map and the period histogram.
 * 2. The same document could hold accident-only data (vehicle cards, pedestrian
 *    cards, collision type) next to non-accident data, so records were semantically
 *    dirty and the write path needed per-type guards to stop the wrong fields
 *    being sent.
 * 3. Only one form per category could ever exist, because `form_definition` keyed
 *    on `incident_type`.
 *
 * There is deliberately no category field: the form a report was filed under *is*
 * its category, so nothing can drift. Adding one back would reintroduce a second
 * source of truth that disagrees with the form.
 *
 * A separate model fixes all three by construction: `accident` now holds only
 * accidents, and an organization can author as many forms as it likes.
 */

/** Report id prefixes, so a report is identifiable without opening it. */
export const incident_report_prefix_array = ["INC"] as const;

export const incident_report_sync_status_array = [
	"draft",
	"queued",
	"syncing",
	"synced",
	"rejected",
] as const;
export const incident_report_sync_status_emums = enums(
	incident_report_sync_status_array,
);

export const incident_report_review_status_array = [
	"submitted",
	"under_review",
	"returned",
	"approved",
	"completed",
] as const;
export const incident_report_review_status_emums = enums(
	incident_report_review_status_array,
);

export const incident_report_review_action_array = [
	"submitted",
	"started_review",
	"returned",
	"resubmitted",
	"approved",
	"completed",
	"reopened",
] as const;

/**
 * A row of `form_answers`/`dynamic_answers`.
 *
 * Identical to `accident.dynamic_answers` — including the raw ObjectId refs,
 * because a Lesan relation cannot live inside an embedded array — so one review
 * screen can read either model.
 */
export const incident_report_dynamic_answer_struct = object({
	step_key: optional(string()),
	question_key: optional(string()),
	model_name: string(),
	answer_id: optional(objectIdValidation),
	answer_ids: optional(array(objectIdValidation)),
	answer_name: optional(string()),
	answer_names: optional(array(string())),
	value: optional(string()),
});

const incident_report_review_struct = object({
	action: enums(incident_report_review_action_array),
	reason: optional(string()),
	action_at: date(),
	reviewer: object({
		_id: objectIdValidation,
		first_name: string(),
		last_name: string(),
	}),
});

/**
 * Provenance of a report filed from the patrol app.
 *
 * Snapshotted at submission for the same reason as `accident`: `device.app_version`
 * is overwritten on every login and so cannot describe a specific submission.
 * Absent for anything not filed from the app.
 */
export const incident_report_submitted_from_struct = object({
	app_version: string(),
	platform: enums(["ios", "android"]),
});

export const incident_report_pure = {
	// --- Which form produced this report -------------------------------------
	// The form is the only classification: an organization names its forms, so
	// there is no separate category field that could disagree with the form.
	//
	// A raw ObjectId rather than a Lesan relation on purpose — a single relation is
	// embedded whole, and inlining a form definition into every report would be
	// unacceptable bloat. An orphaned ref is also survivable, which is one of the
	// sanctioned reasons to keep a raw id.
	form_definition_id: objectIdValidation,
	/**
	 * Which organization the filing officer belongs to, resolved server-side from
	 * the session. Optional on purpose: records that did not come from the app
	 * leave it empty and are not backfilled. Absent from the act set schemas so no
	 * client can file into another organization's console.
	 *
	 * Which build submitted it, when it came from the app.
	 */
	submitted_from: optional(incident_report_submitted_from_struct),

	// Immutable snapshots, so a report still reads correctly after its form is
	// renamed, deactivated or deleted.
	form_title: string(),
	form_icon: optional(string()),
	form_version: optional(number()),

	// --- Identity / idempotency ----------------------------------------------
	client_report_uuid: optional(string()),
	serial: optional(number()),
	report_id: optional(string()),
	reported_at: optional(coerce(date(), string(), (value) => new Date(value))),
	/** Falls back to `reported_at`; what the form's own date question produced. */
	occurred_at: optional(coerce(date(), string(), (value) => new Date(value))),

	// --- Sync lifecycle -------------------------------------------------------
	sync_status: optional(incident_report_sync_status_emums),
	rejection_reason: optional(string()),
	// The instant this report reached `synced`, written once and never rewritten.
	// Per-officer "median sync time" in the oversight console depends on it, and
	// nothing else records it: `updatedAt` keeps moving after a correction.
	// Server-owned — never a client input.
	synced_at: optional(date()),

	// --- Managerial review (independent from sync_status) ----------------------
	review_status: optional(incident_report_review_status_emums),
	review_reason: optional(string()),
	reviewed_at: optional(date()),
	completed_at: optional(date()),
	review_history: optional(array(incident_report_review_struct)),

	// --- The report itself ----------------------------------------------------
	description: optional(string()),
	is_hazard: optional(boolean()),
	needs_repair: optional(boolean()),
	follow_up_required: optional(boolean()),
	temporary_action: optional(string()),

	// --- Form answers ---------------------------------------------------------
	/**
	 * The officer's answer tree, verbatim.
	 *
	 * Intentionally untyped: its schema *is* the definition, which is dynamic by
	 * nature, so a fixed struct cannot validate it. This is the only lossless copy
	 * of a custom answer — bound answers additionally land in typed relations, and
	 * `dynamic_answers` gives a flat row per leaf for querying.
	 */
	form_answers: optional(object({})),
	/** Flat, queryable projection of every unbound leaf answer. */
	dynamic_answers: optional(array(incident_report_dynamic_answer_struct)),

	// --- Location and capture context ----------------------------------------
	location: optional(geoJSONStruct("Point")),
	gps_coords: optional(geoJSONStruct("Point")),
	gps_accuracy: optional(number()),
	travel_direction: optional(string()),
	kilometer: optional(number()),
	meter: optional(number()),

	...createUpdateAt,
};

/**
 * Relations the backend fills in itself, so a form question may not bind to them:
 * the officer has no way to answer them and a bound value would be overwritten.
 */
const backend_owned_relations = new Set(["reviewer"]);

/**
 * Reverse key on the target model.
 *
 * `accidents` is already owned by `accident`, and Lesan forbids declaring the same
 * reverse from two places, so this model introduces its own key everywhere.
 */
const report_reverses = (limit: number) => ({
	incident_reports: {
		type: "multiple" as RelationDataType,
		limit,
		sort: { field: "_id", order: "desc" as RelationSortOrderType },
	},
});

export const incident_report_relations = {
	// Which organization filed this report, when it came from the app. Optional, so
	// records that did not come from the app stay valid.
	//
	// No embedded reverse, for the same reason as `accident.organization`: the
	// console filters on `"organization._id"` and a capped duplicate array would
	// only be misleading.
	organization: {
		schemaName: "organization",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {},
	},
	officer: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: true,
		excludes: user_excludes,
		relatedRelations: report_reverses(50),
	},
	patrol_unit: {
		schemaName: "patrol_unit",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: report_reverses(50),
	},
	vehicle: {
		schemaName: "vehicle",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: report_reverses(50),
	},
	police_station: {
		schemaName: "police_station",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: report_reverses(50),
	},

	// --- Geographic context ---------------------------------------------------
	province: {
		schemaName: "province",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: report_reverses(20),
	},
	city: {
		schemaName: "city",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: report_reverses(20),
	},
	road: {
		schemaName: "road",
		type: "single" as RelationDataType,
		optional: true,
		excludes: road_excludes,
		relatedRelations: report_reverses(20),
	},
	traffic_zone: {
		schemaName: "traffic_zone",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: report_reverses(20),
	},
	city_zone: {
		schemaName: "city_zone",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: report_reverses(20),
	},
	position: {
		schemaName: "position",
		type: "single" as RelationDataType,
		optional: true,
		excludes: share_relation_excludes,
		relatedRelations: report_reverses(20),
	},

	// --- What was found -------------------------------------------------------
	// Bindable by a form question: these are the answer sources an organization
	// picks from when authoring a road-damage or obstruction form.
	incident_severity: {
		schemaName: "incident_severity",
		type: "single" as RelationDataType,
		optional: true,
		excludes: share_relation_excludes,
		relatedRelations: report_reverses(20),
	},
	road_defects: {
		schemaName: "road_defect",
		type: "multiple" as RelationDataType,
		optional: true,
		excludes: share_relation_excludes,
		relatedRelations: report_reverses(20),
	},
	equipment_damages: {
		schemaName: "equipment_damage",
		type: "multiple" as RelationDataType,
		optional: true,
		excludes: share_relation_excludes,
		relatedRelations: report_reverses(20),
	},
	light_status: {
		schemaName: "light_status",
		type: "single" as RelationDataType,
		optional: true,
		excludes: share_relation_excludes,
		relatedRelations: report_reverses(20),
	},
	air_statuses: {
		schemaName: "air_status",
		type: "multiple" as RelationDataType,
		optional: true,
		excludes: share_relation_excludes,
		relatedRelations: report_reverses(20),
	},
	road_surface_conditions: {
		schemaName: "road_surface_condition",
		type: "multiple" as RelationDataType,
		optional: true,
		excludes: share_relation_excludes,
		relatedRelations: report_reverses(20),
	},
	road_situation: {
		schemaName: "road_situation",
		type: "single" as RelationDataType,
		optional: true,
		excludes: share_relation_excludes,
		relatedRelations: report_reverses(20),
	},
	shoulder_status: {
		schemaName: "shoulder_status",
		type: "single" as RelationDataType,
		optional: true,
		excludes: share_relation_excludes,
		relatedRelations: report_reverses(20),
	},
	reviewer: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: true,
		excludes: user_excludes,
		relatedRelations: {},
	},
};

export const incident_report_bindable_paths = Object.keys(
	incident_report_relations,
).filter((path) => !backend_owned_relations.has(path));

export const incident_reports = () => {
	const model = coreApp.odm.newModel(
		"incident_report",
		incident_report_pure,
		incident_report_relations,
	);

	const collection = coreApp.odm.getCollection("incident_report");

	// Idempotency for the offline-first sync: a retried submission must not create
	// a second report. Sparse so a report entered from the web has no uuid.
	collection.createIndex(
		{ client_report_uuid: 1 },
		{ unique: true, sparse: true },
	);

	// Map queries and "near me" lookups.
	collection.createIndex({ location: "2dsphere" });

	// Which form produced a report, for the "reports of this form" view.
	collection.createIndex({ form_definition_id: 1, reported_at: -1 });

	// The review console's default listing.
	collection.createIndex({ sync_status: 1, "officer._id": 1 });
	collection.createIndex({ review_status: 1, reported_at: -1 });

	// Aging and status filters for the oversight console.
	collection.createIndex(
		{ sync_status: 1, reported_at: -1 },
		{ name: "sync_reportedAt" },
	);

	// The oversight console lists one organization's app-filed reports, newest
	// first. Non-unique, so reports without an organization are unaffected.
	collection.createIndex(
		{ "organization._id": 1, reported_at: -1 },
		{ name: "org_reportedAt" },
	);

	return model;
};
