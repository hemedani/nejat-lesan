import { ObjectId } from "@deps";

/**
 * How the wire format maps onto this model's Lesan relations.
 *
 * `accident.add` spells this out as ~200 lines of `if (roadId) relations.road = …`,
 * and the same keys are then listed a second time in its validator. A table keeps
 * one source of truth: the validator's accepted keys and the function that writes
 * the relations cannot drift apart, and adding a bindable relation is a single line.
 *
 * The key naming follows the engine's `relationSetKey`, so a form question bound to
 * `road_defects` with `multi: true` produces exactly `roadDefectsIds`.
 */

/** `set` key → single relation name. */
export const SINGLE_RELATION_KEYS = {
	officerId: "officer",
	patrolUnitId: "patrol_unit",
	vehicleId: "vehicle",
	policeStationId: "police_station",
	provinceId: "province",
	cityId: "city",
	roadId: "road",
	trafficZoneId: "traffic_zone",
	cityZoneId: "city_zone",
	positionId: "position",
	incidentSeverityId: "incident_severity",
	lightStatusId: "light_status",
	roadSituationId: "road_situation",
	shoulderStatusId: "shoulder_status",
} as const;

/** `set` key → multiple relation name. */
export const MULTI_RELATION_KEYS = {
	roadDefectsIds: "road_defects",
	equipmentDamagesIds: "equipment_damages",
	airStatusesIds: "air_statuses",
	roadSurfaceConditionsIds: "road_surface_conditions",
} as const;

export const RELATION_SET_KEYS = [
	...Object.keys(SINGLE_RELATION_KEYS),
	...Object.keys(MULTI_RELATION_KEYS),
] as const;

type SplitRelations = {
	/** Everything that is not a relation id: the document body. */
	doc: Record<string, unknown>;
	/** Lesan relation payloads, ready for `insertOne`/`addRelation`. */
	relations: Record<string, unknown>;
};

/**
 * Pull the relation ids out of a validated `set`.
 *
 * Absent keys are omitted entirely rather than written as empty, so a partial
 * update never nulls a relation.
 */
export const splitRelationIds = (
	set: Record<string, unknown>,
): SplitRelations => {
	const doc: Record<string, unknown> = {};
	const relations: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(set)) {
		if (
			!(key in SINGLE_RELATION_KEYS) && !(key in MULTI_RELATION_KEYS)
		) {
			doc[key] = value;
		}
	}

	for (const [key, relation] of Object.entries(SINGLE_RELATION_KEYS)) {
		const value = set[key];
		// A single relation takes one ObjectId, a multiple takes an array — Lesan
		// passes `_ids` straight through as the `_id` filter, so an array here
		// would never match.
		if (typeof value === "string" && value.length > 0) {
			relations[relation] = { _ids: new ObjectId(value) };
		}
	}

	for (const [key, relation] of Object.entries(MULTI_RELATION_KEYS)) {
		const value = set[key];
		if (!Array.isArray(value)) continue;
		const ids = value.filter((id): id is string =>
			typeof id === "string" && id.length > 0
		);
		if (ids.length > 0) {
			relations[relation] = { _ids: ids.map((id) => new ObjectId(id)) };
		}
	}

	return { doc, relations };
};
