import { coreApp } from "../mod.ts";
import {
	boolean,
	enums,
	number,
	type RelationDataType,
	type RelationSortOrderType,
	string,
	tuple,
} from "@deps";
import { createUpdateAt } from "../utils/createUpdateAt.ts";

export const vehicle_pure = {
	plaque_no: tuple([string(), string(), string()]),
	// plaque_type: enums([
	// 	"private", // شخصی
	// 	"taxi", // تاکسی
	// 	"public", // عمومی (اتوبوس، مینی‌بوس)
	// 	"government", // دولتی
	// 	"police", // انتظامی
	// 	"diplomatic", // سیاسی
	// 	"temporary", // گذرموقت
	// 	"military", // نظامی
	// 	"free_zone", // منطقه آزاد
	// 	"organization", // پلاک سازمانی
	// ]),

	// ISSUE old implemnetation from data of SQL server
	// index_num: number(),
	// did_driver_flee_scene: boolean(),
	// plate_number: string(),
	// vehicle_type: string(),
	// vehicle_system: string(),
	// vehicle_maneuvering: string(),

	// plate_type: string(),
	// safety_equipment: string(),
	// path_direction: string(),
	// signs_on_road: string(),
	// function_after_damage: string(),
	// vehicle_technical_inspection: string(),
	// company_organisation: string(),
	// has_vehicle_load: boolean(),
	// load_type: string(),
	// load_freight: number(),
	// system_incompatibility: boolean(),
	// airbag_function: boolean(),
	// accident_traces: string(),
	// type_of_collision: string(),
	// code_causing_accident: string(),
	// brake_trace_before_accident: number(),
	// brake_trace_after_accident: number(),
	// distance_move_after_accident: number(),
	// acceleration_includings: number(),
	// road_friction_factor: number(),
	// vehicles_height_from_ground: number(),
	// slope_degree_direction: number(),
	// brake_acceleration: number(),
	// roads_curve_radius: number(),
	// tier_marks: number(),
	// qu_driver_noticed_danger: number(),
	// qu_driver_time: number(),
	// qu_maximum_distance_pieces: number(),
	// brake_trace_test_speed: number(),
	// test_speed: number(),
	// is_drivers_identity: boolean(),
	// sex: string(),
	// seat_belt: string(),
	// driver_status: string(),
	// reaction_before_accident: string(),
	// number_of_passengers: number(),

	// is_local: boolean(),
	// trajectory_before_accident: geoJSONStruct("LineString"),
	// trajectory_after_accident: geoJSONStruct("LineString"),

	...createUpdateAt,
};

export const vehicle_relations = {
	registrer: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {},
	},
	color: {
		schemaName: "color",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {},
	},
	plaque_type: {
		schemaName: "plaque_type",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {},
	},
	system_type: {
		schemaName: "system_type",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {},
	},
};

export const vehicles = () =>
	coreApp.odm.newModel("vehicle", vehicle_pure, vehicle_relations);
