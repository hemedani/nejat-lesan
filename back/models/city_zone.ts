import { coreApp } from "../mod.ts";
import {
	number,
	type RelationDataType,
	RelationSortOrderType,
	string,
} from "@deps";
import { geoJSONStruct } from "@model";
import { createUpdateAt } from "../utils/createUpdateAt.ts";

export const city_zone_pure = {
	name: string(),
	area: geoJSONStruct("MultiPolygon"),
	population: number(),

	...createUpdateAt,
};

export const city_zone_relations = {
	registrer: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {},
	},
	city: {
		schemaName: "city",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {
			city_zones: {
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
