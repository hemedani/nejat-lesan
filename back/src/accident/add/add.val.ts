/**
 * -----------------------------------------------------------------------------
 * FILE: src/accident/add/add.val.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Defines the validation schema for creating a new accident. It separates the
 * pure accident data from the ObjectIDs of its relations.
 */
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
import { selectStruct } from "../../../mod.ts";
import { common_relation_struct, geoJSONStruct } from "@model";

export const addValidator = () => {
	// Manually define a deeply optional version of the accident_pure schema.
	// This is necessary to avoid TypeScript inference errors and to ensure
	// that nested objects and their properties are also optional during validation.
	const optionalPureAccident = {
		seri: optional(number()),
		serial: optional(number()),
		location: geoJSONStruct("Point"),
		date_of_accident: coerce(date(), string(), (value) => new Date(value)),
		dead_count: optional(number()),
		has_witness: optional(boolean()),
		news_number: optional(number()),
		officer: optional(string()),
		injured_count: optional(number()),
		completion_date: optional(
			coerce(date(), string(), (value) => new Date(value)),
		),
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
	};

	return object({
		set: object({
			// Include all pure fields from the accident schema
			...optionalPureAccident,

			// --- IDs for Relational Fields ---
			// Single Relations
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
