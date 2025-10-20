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
import {
	area_excludes,
	city_zone_excludes,
	file_excludes,
	geoJSONStruct,
	road_excludes,
	share_relation_excludes,
	traffic_zone_excludes,
} from "@model";
import { createUpdateAt } from "../utils/createUpdateAt.ts";

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

	...createUpdateAt,
};

export const accident_relations = {
	province: {
		schemaName: "province",
		type: "single" as RelationDataType,
		optional: true,
		excludes: area_excludes,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 20,
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
		excludes: area_excludes,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 20,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	township: {
		schemaName: "township",
		type: "single" as RelationDataType,
		optional: true,
		excludes: area_excludes,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 20,
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
		excludes: road_excludes,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 20,
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
		excludes: traffic_zone_excludes,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 20,
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
		excludes: city_zone_excludes,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 20,
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
		excludes: share_relation_excludes,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 20,
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
		excludes: share_relation_excludes,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 20,
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
		excludes: share_relation_excludes,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 20,
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
		excludes: share_relation_excludes,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 20,
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
		excludes: share_relation_excludes,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 20,
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
		excludes: share_relation_excludes,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 20,
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
		excludes: share_relation_excludes,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 20,
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
		excludes: share_relation_excludes,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 20,
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
		excludes: share_relation_excludes,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 20,
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
		excludes: share_relation_excludes,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 20,
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
		excludes: share_relation_excludes,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 20,
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
		excludes: share_relation_excludes,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 20,
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
		excludes: share_relation_excludes,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 20,
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
		excludes: share_relation_excludes,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 20,
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
		excludes: share_relation_excludes,
		relatedRelations: {
			accidents: {
				type: "multiple" as RelationDataType,
				limit: 20,
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
		excludes: ["createdAt", "updatedAt"],
		relatedRelations: {},
	},
};

export const accidents = () =>
	coreApp.odm.newModel("accident", accident_pure, accident_relations, {
		createIndex: {
			indexSpec: {
				location: "2dsphere",
			},
		},
	});
