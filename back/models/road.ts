import { coreApp } from "../mod.ts";
import {
	type RelationDataType,
	type RelationSortOrderType,
	string,
} from "@deps";
import { area_excludes, geoJSONStruct, user_excludes } from "@model";
import { createUpdateAt } from "../utils/createUpdateAt.ts";

export const road_pure = {
	name: string(),
	area: geoJSONStruct("MultiLineString"), // -- محدوده بومی (اگر متفاوت است)

	...createUpdateAt,
};

export const road_excludes = ["area", "updatedAt", "createdAt"];

export const road_relations = {
	registrer: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: true,
		excludes: user_excludes,
		relatedRelations: {},
	},
	province: {
		schemaName: "province",
		type: "single" as RelationDataType, // ISSUE shayad har mehvar male chand ta ostan bashe.
		optional: true,
		excludes: area_excludes,
		relatedRelations: {
			axeses: {
				type: "multiple" as RelationDataType,
				limit: 50,
				excludes: road_excludes,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
};

export const roads = () =>
	coreApp.odm.newModel("road", road_pure, road_relations, {
		createIndex: {
			indexSpec: {
				area: "2dsphere",
			},
		},
	});
