import { coreApp } from "../mod.ts";
import {
	array,
	boolean,
	date,
	enums,
	number,
	object,
	objectIdValidation,
	optional,
	type RelationDataType,
	type RelationSortOrderType,
	string,
	tuple,
} from "@deps";
import { geoJSONStruct } from "@model";

export const day_of_week = enums([
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
	"Sunday",
]);

export const common_relation_struct = object({
	_id: objectIdValidation,
	name: string(),
});

export const accident_pure = {
	seri: number(), // seri number for the accident record
	serial: number(), // Unique serial number for the accident record
	location: geoJSONStruct("Point"), // GeoJSON point representing the accident location
	// distance_from_origin: number(), // Distance from a reference origin point
	date_of_accident: date(), // Date when the accident occurred

	dead_count: number(),
	has_witness: boolean(),
	news_number: number(),
	officer: string(),

	injured_count: number(),
	completion_date: date(),

	vehicle_dtos: array(
		object({
			color: common_relation_struct,
			driver: object({
				sex: enums(["Male", "Female", "Other"]),
				last_name: string(),
				first_name: string(),
				injury_type: common_relation_struct,
				licence_type: common_relation_struct,
				national_code: string(),
				licence_number: optional(string()),
				total_reason: optional(common_relation_struct),
			}),
			system: common_relation_struct,
			plaque_type: common_relation_struct,
			plaque_no: tuple([string(), string(), string()]),
			system_type: common_relation_struct,
			fault_status: common_relation_struct,
			insurance_co: common_relation_struct,
			insurance_no: string(),
			plaque_usage: common_relation_struct,
			print_number: string(),
			plaque_serial: optional(array(string())),
			insurance_date: date(),
			body_insurance_co: common_relation_struct,
			body_insurance_no: optional(string()),
			motion_direction: common_relation_struct,
			body_insurance_date: date(),
			max_damage_sections: array(common_relation_struct),
			damage_section_other: string(),
			insurance_warranty_limit: number(),
			passenger_dtos: optional(array(object({
				sex: enums(["Male", "Female", "Other"]),
				last_name: string(),
				first_name: string(),
				injury_type: common_relation_struct,
				fault_status: common_relation_struct,
				total_reason: optional(common_relation_struct),
				national_code: string(),
			}))),
		}),
	),

	pedestrian_dtos: optional(array(object({
		sex: enums(["Male", "Female", "Other"]),
		last_name: string(),
		first_name: string(),
		injury_type: common_relation_struct,
		fault_status: common_relation_struct,
		total_reason: optional(common_relation_struct),
		national_code: string(),
	}))),
	// ---------------------------- fixed with new JSON file
	// // ISSUE I thing time_of_accident is an extra fields
	// time_of_accident: date(), // The actual date time with millisecond of accident occurred

	// police_awareness_time: date(), // Time when the police were notified of the accident
	// police_arrival_time: date(), // Time when the police arrived at the accident scene
	// ems_arrival_time: date(), // Time when Emergency Medical Services (EMS) arrived at the scene
	// sos_arrival_time: date(), // Time when SOS services arrived at the scene
	// submit_date: date(), // Date when the accident report was submitted

	// form_is_completed: boolean(), // Flag indicating if the accident report form is fully completed
	// is_shoulder_road: boolean(), // Flag indicating if the accident occurred on a shoulder road
	// location_description: string(), // Textual description of the accident location
	// maximum_speed_limit: number(), // Maximum speed limit at the accident location
	// final_reason: number(), // Code or identifier for the final determined reason for the accident
	// number_vehicles_involved: number(), // Number of vehicles involved in the accident
	// number_pedestrians_involved: number(), // Number of pedestrians involved in the accident
	// number_bike_involved: number(), // Number of bicycles involved in the accident
	// number_of_injured: number(), // Number of people injured in the accident

	// day_of_week, // Day of the week when the accident occurred
	// status_icon: string(), // Icon representing the status of the accident report or event

	// // ISSUE question: Mybe should be diffrent type
	// lack_of_attention: string(), // Description or flag for lack of attention as a contributing factor
	// inability_control_vehicle: string(), // Description or flag for inability to control the vehicle as a contributing factor

	// // ISSUE question: Mybe shlould be number
	// shoulders_width: string(), // Width of the road shoulder
	// roadway_width_main: string(), // Width of the main roadway

	// // ISSUE question: Mybe Should be ENUMS or reffrence and relation with status_types schema
	// police_awareness_type: string(), // How the police were made aware of the accident (e.g., phone call, patrol)
	// crash_type: string(), // Type of crash (e.g., rear-end, head-on)
	// crash_scene: string(), // Description of the crash scene (e.g., intersection, highway segment)
	// type_of_collision: string(), // Specific type of collision (e.g., vehicle-vehicle, vehicle-pedestrian)
	// road_defects: string(), // Description of any road defects present
	// carriage_way_direction: string(), // Direction of the carriageway (e.g., northbound, eastbound)
	// lighting_status: string(), // Lighting conditions at the time of the accident (e.g., daylight, dark - lit)
	// road_surface_condition: string(), // Condition of the road surface (e.g., dry, wet, icy)
	// visual_obstruction: string(), // Description of any visual obstructions
	// car_crash_location: string(), // Specific location of the car crash (e.g., on bridge, in tunnel)
	// weather: string(), // Weather conditions at the time of the accident
	// geometric_design: string(), // Description of the road's geometric design features
	// pavement_marking: string(), // Condition or type of pavement markings
	// vehicle_factor_in_car_crash: string(), // Vehicle-related factors contributing to the crash
	// human_factor_in_car_crash: string(), // Human-related factors contributing to the crash
	// judicial_cause: string(), // Judicial cause or legal determination related to the accident
	// shoulder_road: string(), // Description of the shoulder road type // ISSUE or maybe should be number
	// road_maintenance: string(), // Information about road maintenance status // ISSUE or maybe should be number
	// road_assets_damage: string(), // Description of damage to road assets // ISSUE or maybe should be number
	// location_land_use: string(), // Land use classification of the accident location (e.g., residential, commercial)

	// // ISSUE I make this fields actual relation:
	// // accident_diagram_image: string(),
	// // explanation_audio: string(),
	// // primary_cause_audio: string(),
	// // former_cause_audio: string(),
	// // direct_cause_audio: string(),

	// primary_cause_text: string(), // Textual description of the primary cause of the accident
	// former_cause_text: string(), // Textual description of a former or preceding cause
	// direct_cause_text: string(), // Textual description of the direct cause of the accident

	// direct_cause_percent: number(), // Percentage contribution of the direct cause
	// cause_percent: number(), // Overall percentage assigned to the cause(s)

	// check_by_police_station_admin: object({ // Object containing police station admin check details
	// 	checked: boolean(), // Flag indicating if checked by police station admin
	// 	time: date(), // Timestamp of the check by police station admin
	// }),

	// check_by_camp_admin: object({ // Object containing camp admin check details
	// 	checked: boolean(), // Flag indicating if checked by camp admin
	// 	time: date(), // Timestamp of the check by camp admin
	// }),

	// in_native_area: boolean(), // Flag indicating if the accident occurred in a native or designated area
	// is_holiday: boolean(), // Flag indicating if the accident occurred on a holiday

	// date_insert: date(), // Date when the record was inserted into the system

	// // ISSUE myble should create organization table
	// organizations_to_blame: string(), // Organizations identified as potentially blameworthy
};

export const accident_relations = {
	province: {
		schemaName: "province",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 50,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	city: {
		schemaName: "city",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 50,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	road: {
		schemaName: "road",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 50,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	traffic_zone: {
		schemaName: "traffic_zone",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 50,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	city_zone: {
		schemaName: "city_zone",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 50,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	type: {
		schemaName: "type",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 50,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	area_usages: {
		schemaName: "area_usage",
		type: "multiple" as RelationDataType,
		optional: true,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 50,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	position: {
		schemaName: "position",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 50,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	ruling_type: {
		schemaName: "ruling_type",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 50,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	air_statuses: {
		schemaName: "air_status",
		type: "multiple" as RelationDataType,
		optional: true,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 50,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	light_status: {
		schemaName: "light_status",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 50,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	road_defects: {
		schemaName: "road_defect",
		type: "multiple" as RelationDataType,
		optional: true,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 50,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	human_reasons: {
		schemaName: "human_reason",
		type: "multiple" as RelationDataType,
		optional: true,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 50,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	collision_type: {
		schemaName: "collision_type",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 50,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	road_situation: {
		schemaName: "road_situation",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 50,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	road_repair_type: {
		schemaName: "road_repair_type",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 50,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	shoulder_status: {
		schemaName: "shoulder_status",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 50,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	vehicle_reasons: {
		schemaName: "vehicle_reason",
		type: "multiple" as RelationDataType,
		optional: true,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 50,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	equipment_damages: {
		schemaName: "equipment_damage",
		type: "multiple" as RelationDataType,
		optional: true,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 50,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	road_surface_conditions: {
		schemaName: "road_surface_condition",
		type: "multiple" as RelationDataType,
		optional: true,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 50,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	attachments: {
		schemaName: "file",
		type: "multiple" as RelationDataType,
		optional: true,
		relatedRelations: {},
	},
	// event_processes: {
	// 	schemaName: "event_process",
	// 	type: "multiple" as RelationDataType,
	// 	optional: false,

	// 	relatedRelations: {
	// 		accidents: {
	// 			type: "multiple" as RelationDataType,
	// 			limit: 50,
	// 			sort: {
	// 				field: "_id",
	// 				order: "desc" as RelationSortOrderType,
	// 			},
	// 		},
	// 	},
	// },
	// police_station_admin: {
	// 	schemaName: "user",
	// 	type: "single" as RelationDataType,
	// 	optional: true,
	// 	relatedRelations: {},
	// },
	// submit_by_user: {
	// 	schemaName: "user",
	// 	type: "single" as RelationDataType,
	// 	optional: true,
	// 	relatedRelations: {
	// 		submited_accidents: {
	// 			type: "multiple" as RelationDataType,
	// 			limit: 50,
	// 			sort: {
	// 				field: "_id",
	// 				order: "desc" as RelationSortOrderType,
	// 			},
	// 		},
	// 	},
	// },
	// accident_diagram_image: {
	// 	schemaName: "file",
	// 	type: "single" as RelationDataType,
	// 	optional: true,
	// 	relatedRelations: {},
	// },
	// explanation_audio: {
	// 	schemaName: "file",
	// 	type: "single" as RelationDataType,
	// 	optional: true,
	// 	relatedRelations: {},
	// },
	// primary_cause_audio: {
	// 	schemaName: "file",
	// 	type: "single" as RelationDataType,
	// 	optional: true,
	// 	relatedRelations: {},
	// },
	// former_cause_audio: {
	// 	schemaName: "file",
	// 	type: "single" as RelationDataType,
	// 	optional: true,
	// 	relatedRelations: {},
	// },
	// direct_cause_audio: {
	// 	schemaName: "file",
	// 	type: "single" as RelationDataType,
	// 	optional: true,
	// 	relatedRelations: {},
	// },
	// driver: {
	// 	schemaName: "person",
	// 	type: "single" as RelationDataType,
	// 	optional: true,
	// 	relatedRelations: {
	// 		dirver_accidents: {
	// 			type: "multiple" as RelationDataType,
	// 			limit: 50,
	// 			sort: {
	// 				field: "_id",
	// 				order: "desc" as RelationSortOrderType,
	// 			},
	// 		},
	// 	},
	// },
	// passengers: {
	// 	schemaName: "person",
	// 	type: "multiple" as RelationDataType,
	// 	optional: true,
	// 	relatedRelations: {
	// 		passenger_accidents: {
	// 			type: "multiple" as RelationDataType,
	// 			limit: 50,
	// 			sort: {
	// 				field: "_id",
	// 				order: "desc" as RelationSortOrderType,
	// 			},
	// 		},
	// 	},
	// },
	// biker: {
	// 	schemaName: "person",
	// 	type: "single" as RelationDataType,
	// 	optional: true,
	// 	relatedRelations: {
	// 		biker_accidents: {
	// 			type: "multiple" as RelationDataType,
	// 			limit: 50,
	// 			sort: {
	// 				field: "_id",
	// 				order: "desc" as RelationSortOrderType,
	// 			},
	// 		},
	// 	},
	// },
	// pedestrians: {
	// 	schemaName: "person",
	// 	type: "multiple" as RelationDataType,
	// 	optional: true,
	// 	relatedRelations: {
	// 		pedestrian_accidents: {
	// 			type: "multiple" as RelationDataType,
	// 			limit: 50,
	// 			sort: {
	// 				field: "_id",
	// 				order: "desc" as RelationSortOrderType,
	// 			},
	// 		},
	// 	},
	// },
};

export const accidents = () =>
	coreApp.odm.newModel("accident", accident_pure, accident_relations, {
		createIndex: {
			indexSpec: {
				location: "2dsphere",
			},
		},
	});
