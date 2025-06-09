import { coreApp } from "../mod.ts";
import {
	boolean,
	type RelationDataType,
	RelationSortOrderType,
	string,
} from "@deps";
import { createUpdateAt } from "../utils/createUpdateAt.ts";
import { geoJSONStruct } from "@model";

export const location_area_pure = {
	caption: string(),
	in_native_area: boolean(),
	area: geoJSONStruct("Polygon"), // -- محدوده بومی (اگر متفاوت است)

	...createUpdateAt,
};

export const location_area_relations = {
	registrer: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {},
	},
	province: {
		schemaName: "province",
		type: "single" as RelationDataType, // ISSUE shayad har mehvar male chand ta ostan bashe.
		optional: true,
		relatedRelations: {
			location_areas: {
				type: "multiple" as RelationDataType,
				limit: 50,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	city: {
		schemaName: "city",
		type: "single" as RelationDataType, // ISSUE shayad har mehvar male chand ta ostan bashe.
		optional: true,
		relatedRelations: {
			location_areas: {
				type: "multiple" as RelationDataType,
				limit: 50,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	axes: {
		schemaName: "axes",
		type: "single" as RelationDataType, // ISSUE shayad har mehvar male chand ta ostan bashe.
		optional: true,
		relatedRelations: {
			location_areas: {
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

export const location_areas = () =>
	coreApp.odm.newModel(
		"location_area",
		location_area_pure,
		location_area_relations,
		{
			createIndex: {
				indexSpec: {
					area: "2dsphere",
				},
			},
		},
	);
