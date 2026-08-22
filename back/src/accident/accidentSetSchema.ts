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
	tuple,
} from "@deps";
import { common_relation_struct, geoJSONStruct } from "@model";

/**
 * Shared, all-optional `set` schema for the accident pure fields.
 * Used by the `add` (with location/date_of_accident overridden to required)
 * and `update` validators so the two acts stay in sync.
 */
export const accidentSetSchema = object({
	seri: optional(number()),
	serial: optional(number()),
	location: optional(geoJSONStruct("Point")),
	date_of_accident: optional(
		coerce(date(), string(), (value) => new Date(value)),
	),
	dead_count: optional(number()),
	has_witness: optional(boolean()),
	news_number: optional(number()),
	officer: optional(string()),
	injured_count: optional(number()),
	completion_date: optional(
		coerce(date(), string(), (value) => new Date(value)),
	),

	// Mobile patrol meta (offline-first sync)
	client_report_uuid: optional(string()),
	report_id: optional(string()),
	sync_status: optional(
		enums(["draft", "queued", "syncing", "synced", "rejected"]),
	),
	rejection_reason: optional(string()),
	reported_at: optional(coerce(date(), string(), (value) => new Date(value))),
	gps_coords: optional(geoJSONStruct("Point")),
	gps_accuracy: optional(number()),
	travel_direction: optional(string()),
	kilometer: optional(number()),
	meter: optional(number()),

	// Police / croquis block (Phase 3)
	police_present: optional(boolean()),
	police_expert_name: optional(string()),
	police_arrival_time: optional(
		coerce(date(), string(), (value) => new Date(value)),
	),
	officer_cause_description: optional(string()),

	vehicle_dtos: optional(array(
		object({
			color: optional(common_relation_struct),
			driver: optional(object({
				sex: optional(enums(["Male", "Female", "Other"])),
				last_name: optional(string()),
				first_name: optional(string()),
				injury_type: optional(common_relation_struct),
				licence_type: optional(common_relation_struct),
				national_code: optional(string()),
				licence_number: optional(string()),
				total_reason: optional(common_relation_struct),
				phone: optional(string()),
				driver_status: optional(common_relation_struct),
			})),
			system: optional(common_relation_struct),
			plaque_type: optional(common_relation_struct),
			plaque_no: optional(tuple([string(), string(), string()])),
			system_type: optional(common_relation_struct),
			fault_status: optional(common_relation_struct),
			insurance_co: optional(common_relation_struct),
			insurance_no: optional(string()),
			plaque_usage: optional(common_relation_struct),
			print_number: optional(string()),
			plaque_serial: optional(array(string())),
			insurance_date: optional(
				coerce(date(), string(), (value) => new Date(value)),
			),
			body_insurance_co: optional(common_relation_struct),
			body_insurance_no: optional(string()),
			motion_direction: optional(common_relation_struct),
			body_insurance_date: optional(
				coerce(date(), string(), (value) => new Date(value)),
			),
			max_damage_sections: optional(array(common_relation_struct)),
			damage_section_other: optional(string()),
			insurance_warranty_limit: optional(number()),
			passenger_dtos: optional(array(object({
				sex: optional(enums(["Male", "Female", "Other"])),
				last_name: optional(string()),
				first_name: optional(string()),
				injury_type: optional(common_relation_struct),
				fault_status: optional(common_relation_struct),
				total_reason: optional(common_relation_struct),
				national_code: optional(string()),
			}))),
			vehicle_type: optional(common_relation_struct),
			year: optional(number()),
			final_status: optional(common_relation_struct),
			plate_image: optional(objectIdValidation),
			insurance_image: optional(objectIdValidation),
		}),
	)),
	pedestrian_dtos: optional(array(object({
		sex: optional(enums(["Male", "Female", "Other"])),
		last_name: optional(string()),
		first_name: optional(string()),
		injury_type: optional(common_relation_struct),
		fault_status: optional(common_relation_struct),
		total_reason: optional(common_relation_struct),
		national_code: optional(string()),
	}))),

	// People cards (Phase 5)
	people_dtos: optional(array(object({
		role: optional(common_relation_struct),
		sex: optional(enums(["Male", "Female", "Other"])),
		age: optional(number()),
		age_range: optional(string()),
		injury_status: optional(common_relation_struct),
		first_name: optional(string()),
		last_name: optional(string()),
		national_code: optional(string()),
		phone: optional(string()),
	}))),

	// Facility damage cards (Phase 7)
	facility_damage_dtos: optional(array(object({
		asset_group: optional(common_relation_struct),
		asset_code: optional(string()),
		damage_type: optional(string()),
		damage_severity: optional(common_relation_struct),
		quantity: optional(number()),
		unit: optional(string()),
		creates_hazard: optional(boolean()),
		needs_repair: optional(boolean()),
		temporary_action: optional(string()),
		images: optional(array(objectIdValidation)),
	}))),
});
