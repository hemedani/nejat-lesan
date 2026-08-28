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
	air_pollution_zone_excludes,
	area_excludes,
	city_zone_excludes,
	geoJSONStruct,
	road_excludes,
	share_relation_excludes,
	traffic_zone_excludes,
} from "@model";
import { createUpdateAt } from "../utils/createUpdateAt.ts";
import { common_relation_struct } from "./utils/commonRelation.ts";

export const day_of_week = enums([
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
	"Sunday",
]);

export const accident_review_action_array = [
	"submitted",
	"started_review",
	"returned",
	"resubmitted",
	"approved",
	"completed",
	"reopened",
] as const;

/**
 * ساختار یک ورودی از تاریخچه بررسی گزارش.
 * reviewer به‌صورت snapshot نگهداری می‌شود (نه رابطه‌ی زنده) تا تاریخچه
 * ممیزی تغییرات بعدیِ اطلاعات کاربر را دنبال نکند.
 */
export const accident_review_struct = object({
	action: enums(accident_review_action_array),
	reason: optional(string()),
	action_at: date(),
	reviewer: object({
		_id: objectIdValidation,
		first_name: string(),
		last_name: string(),
	}),
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

	// --- Mobile patrol meta (offline-first sync) ---
	// Client-generated idempotency key (uuid) created by the app before submit
	client_report_uuid: optional(string()),
	// Server-generated human-readable report id (e.g. "REP-1404-000123")
	report_id: optional(string()),
	// Sync lifecycle state of the report
	sync_status: optional(
		enums(["draft", "queued", "syncing", "synced", "rejected"]),
	),
	// Reason set when sync_status becomes "rejected"
	rejection_reason: optional(string()),
	// Managerial review lifecycle. This is independent from sync_status.
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
	reviewed_at: optional(date()),
	completed_at: optional(date()),
	// Moment the officer recorded the accident on the device
	reported_at: optional(date()),
	// Officer's actual GPS location when reporting
	gps_coords: optional(geoJSONStruct("Point")),
	// GPS horizontal accuracy in meters
	gps_accuracy: optional(number()),
	// Direction of travel at reporting time (e.g. "تهران - قم")
	travel_direction: optional(string()),
	// Linear referencing: kilometer + meter along the road
	kilometer: optional(number()),
	meter: optional(number()),

	// --- Police / croquis block (Phase 3) ---
	// Whether police attended the scene
	police_present: optional(boolean()),
	// Name of the police expert present at the scene
	police_expert_name: optional(string()),
	// Time police arrived at the scene
	police_arrival_time: optional(date()),
	// Officer's free-text description of the accident cause
	officer_cause_description: optional(string()),

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
				// --- Driver expansion (Phase 4) ---
				phone: optional(string()),
				driver_status: optional(common_relation_struct),
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
			// --- Vehicle expansion (Phase 4) ---
			// Vehicle category (سواری، وانت، کامیون، …)
			vehicle_type: optional(common_relation_struct),
			// Manufacturing year
			year: optional(number()),
			// Final vehicle state after the accident (متوقف در مسیر، واژگون، …)
			final_status: optional(common_relation_struct),
			// File reference to the plate photo
			plate_image: optional(objectIdValidation),
			// File reference to the insurance policy / vehicle card photo
			insurance_image: optional(objectIdValidation),
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

	// --- People cards (Phase 5): unified list of راننده/سرنشین/عابر/… ---
	people_dtos: optional(array(object({
		role: common_relation_struct,
		sex: enums(["Male", "Female", "Other"]),
		age: optional(number()),
		age_range: optional(string()),
		injury_status: common_relation_struct,
		first_name: optional(string()),
		last_name: optional(string()),
		national_code: optional(string()),
		phone: optional(string()),
	}))),

	// --- Facility / infrastructure damage cards (Phase 7) ---
	facility_damage_dtos: optional(array(object({
		asset_group: common_relation_struct,
		asset_code: optional(string()),
		damage_type: optional(string()),
		damage_severity: common_relation_struct,
		quantity: optional(number()),
		unit: optional(string()),
		creates_hazard: optional(boolean()),
		needs_repair: optional(boolean()),
		temporary_action: optional(string()),
		images: optional(array(objectIdValidation)),
	}))),

	// --- Managerial review audit trail (embedded, replaces accident_review) ---
	review_history: optional(array(accident_review_struct)),

	...createUpdateAt,
};

export const accident_relations = {
	reviewer: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {},
	},
	officer: {
		schemaName: "user",
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
	patrol_unit: {
		schemaName: "patrol_unit",
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
	vehicle: {
		schemaName: "vehicle",
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
	// "lane" also points at `position`; no reverse declared because
	// `accident.position` already owns `position.accidents`.
	lane: {
		schemaName: "position",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {},
	},
	police_station: {
		schemaName: "police_station",
		type: "single" as RelationDataType,
		optional: true,
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
	croquis_type: {
		schemaName: "croquis_type",
		type: "single" as RelationDataType,
		optional: true,
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
	air_pollution_zone: {
		schemaName: "air_pollution_zone",
		type: "single" as RelationDataType,
		optional: true,
		excludes: air_pollution_zone_excludes,
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

export const accident_excludes = ["createdAt", "updatedAt"];

export const accidents = () => {
	const model = coreApp.odm.newModel(
		"accident",
		accident_pure,
		accident_relations,
		{
			createIndex: {
				indexSpec: {
					location: "2dsphere",
				},
			},
		},
	);

	coreApp.odm.getCollection("accident").createIndex(
		{ client_report_uuid: 1 },
		{ unique: true, sparse: true },
	);

	return model;
};
