import { coreApp } from "../mod.ts";
import {
	date,
	defaulted,
	enums,
	number,
	optional,
	type RelationDataType,
	type RelationSortOrderType,
	string,
} from "@deps";
import { createUpdateAt } from "../utils/createUpdateAt.ts";
import { geoJSONStruct } from "./utils/geoJSONStruct.ts";
import { user_excludes } from "./user.ts";

export const emergency_status_array = [
	"active",
	"acknowledged",
	"resolved",
] as const;
export const emergency_status_enums = enums(emergency_status_array);

/** وضعیت اتصال مأمور در لحظه ثبت درخواست امداد */
export const emergency_connection_array = [
	"online",
	"degraded",
	"offline",
] as const;
export const emergency_connection_enums = enums(emergency_connection_array);

/**
 * درخواست امداد اضطراری (SOS) مأمور گشت.
 * شناسه مأمور از توکن استخراج می‌شود؛ یگان و خودرو از شیفت فعال
 * به‌صورت خودکار روی سند جاسازی می‌شوند.
 * مسیر آفلاین (پیامک/تماس) سیاست عملیاتی است و خارج از این مدل است.
 */
export const emergency_pure = {
	status: defaulted(emergency_status_enums, "active"),
	connection_status: optional(emergency_connection_enums),
	note: optional(string()),
	location: optional(geoJSONStruct("Point")),
	gps_accuracy: optional(number()),
	recorded_at: defaulted(date(), () => new Date()),
	resolved_at: optional(date()),

	...createUpdateAt,
};

export const emergency_relations = {
	officer: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: false,
		excludes: user_excludes,
		relatedRelations: {
			emergencies: {
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
			emergencies: {
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
			emergencies: {
				type: "multiple" as RelationDataType,
				limit: 50,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
};

export const emergencies = () =>
	coreApp.odm.newModel("emergency", emergency_pure, emergency_relations);
