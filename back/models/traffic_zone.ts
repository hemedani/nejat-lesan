import { coreApp } from "../mod.ts";
import { number, type RelationDataType, string } from "@deps";
import { geoJSONStruct } from "@model";
import { createUpdateAt } from "../utils/createUpdateAt.ts";

export const traffic_zone_pure = {
	name: string(),
	area: geoJSONStruct("MultiPolygon"), // -- محدوده بومی (اگر متفاوت است)
	population: number(),

	...createUpdateAt,
};

export const traffic_zone_relations = {
	registrer: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {},
	},
};

export const traffic_zones = () =>
	coreApp.odm.newModel(
		"traffic_zone",
		traffic_zone_pure,
		traffic_zone_relations,
		{
			createIndex: {
				indexSpec: {
					area: "2dsphere",
				},
			},
		},
	);
