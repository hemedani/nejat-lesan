import { coreApp } from "../mod.ts";
import { boolean, number, type RelationDataType, string } from "@deps";
import { createUpdateAt } from "../utils/createUpdateAt.ts";
import { geoJSONStruct } from "@model";

export const police_station_pure = {
	name: string(),
	location: geoJSONStruct("Polygon"),
	area: geoJSONStruct("MultiPolygon"),
	code: number(),
	is_active: boolean(),
	military_rank: number(),

	...createUpdateAt,
};

export const police_station_relations = {
	registrer: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {},
	},
	commander: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {
			police_station: {
				type: "single" as RelationDataType,
			},
		},
	},
};

export const police_stations = () =>
	coreApp.odm.newModel(
		"police_station",
		police_station_pure,
		police_station_relations,
	);
