import { coreApp } from "../mod.ts";
import {
	number,
	type RelationDataType,
	RelationSortOrderType,
	string,
} from "@deps";
import { area_excludes, geoJSONStruct, user_excludes } from "@model";
import { createUpdateAt } from "../utils/createUpdateAt.ts";

export const air_pollution_zone_pure = {
	name: string(),
	area: geoJSONStruct("MultiPolygon"),
	population: number(),

	...createUpdateAt,
};

export const air_pollution_zone_excludes = [
	"area",
	"createdAt",
	"updatedAt",
];

export const air_pollution_zone_relations = {
	registrer: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: true,
		excludes: user_excludes,
		relatedRelations: {},
	},
	city: {
		schemaName: "city",
		type: "single" as RelationDataType,
		optional: true,
		excludes: area_excludes,
		relatedRelations: {
			air_pollution_zones: {
				type: "multiple" as RelationDataType,
				limit: 50,
				excludes: air_pollution_zone_excludes,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
};

export const air_pollution_zones = () =>
	coreApp.odm.newModel(
		"air_pollution_zone",
		air_pollution_zone_pure,
		air_pollution_zone_relations,
		{
			createIndex: {
				indexSpec: {
					area: "2dsphere",
				},
			},
		},
	);
