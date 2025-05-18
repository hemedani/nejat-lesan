import { coreApp } from "../mod.ts";
import {
	number,
	type RelationDataType,
	type RelationSortOrderType,
} from "@deps";
import { geoJSONStruct, pure_location } from "./province.ts";
import { createUpdateAt } from "../utils/createUpdateAt.ts";

export const city_pure = {
	...pure_location,

	native_area: geoJSONStruct("Polygon"), // -- محدوده بومی (اگر متفاوت است)
	non_native_area: geoJSONStruct("Polygon"), // -- محدوده غیربومی (اگر متفاوت است)
	population: number(),
	area_number: number(),

	...createUpdateAt,
};

export const city_relations = {
	registrer: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {},
	},
	country: {
		schemaName: "country",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {
			cities: {
				type: "multiple" as RelationDataType,
				limit: 50,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
			capital: {
				type: "single" as RelationDataType,
			},
		},
	},
	province: {
		schemaName: "province",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {
			cities: {
				type: "multiple" as RelationDataType,
				limit: 50,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
			center: {
				type: "single" as RelationDataType,
			},
		},
	},
};

export const cities = () =>
	coreApp.odm.newModel("city", city_pure, city_relations);
