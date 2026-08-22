import { coreApp } from "../mod.ts";
import {
	array,
	type RelationDataType,
	type RelationSortOrderType,
	number,
	optional,
	string,
} from "@deps";
import {
	area_excludes,
	geoJSONStruct,
	user_excludes,
} from "@model";
import { common_relation_struct } from "./utils/commonRelation.ts";
import { createUpdateAt } from "../utils/createUpdateAt.ts";

export const road_pure = {
	name: string(),
	area: geoJSONStruct("MultiLineString"), // -- محدوده بومی (اگر متفاوت است) / ordered geometry for linear referencing

	// --- Linear referencing & patrol (Step 9) ---
	// Origin / destination endpoint names (direction metadata)
	origin: optional(string()),
	destination: optional(string()),
	// Cached total geometry length in meters (validates km/m reports)
	total_length_meters: optional(number()),
	// Lane/band definitions referencing `position` docs ({ _id, name })
	lanes: optional(array(common_relation_struct)),

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
