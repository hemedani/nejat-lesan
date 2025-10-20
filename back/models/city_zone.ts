import { coreApp } from "../mod.ts";
import {
	number,
	type RelationDataType,
	RelationSortOrderType,
	string,
} from "@deps";
import { area_excludes, geoJSONStruct, user_excludes } from "@model";
import { createUpdateAt } from "../utils/createUpdateAt.ts";

export const city_zone_pure = {
	name: string(),
	area: geoJSONStruct("MultiPolygon"),
	population: number(),

	...createUpdateAt,
};

export const city_zone_excludes = ["area", "createdAt", "updatedAt"];

export const city_zone_relations = {
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
			city_zones: {
				type: "multiple" as RelationDataType,
				limit: 50,
				excludes: city_zone_excludes,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
};

export const city_zones = () =>
	coreApp.odm.newModel(
		"city_zone",
		city_zone_pure,
		city_zone_relations,
		{
			createIndex: {
				indexSpec: {
					area: "2dsphere",
				},
			},
		},
	);
