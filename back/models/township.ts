import { coreApp } from "../mod.ts";
import { type RelationDataType, type RelationSortOrderType } from "@deps";
import { area_excludes, pure_location } from "@model";

export const township_pure = {
	...pure_location,
	// native_area: geoJSONStruct("MultiPolygon"), // -- محدوده بومی (اگر متفاوت است)
	// non_native_area: geoJSONStruct("MultiPolygon"), // -- محدوده غیربومی (اگر متفاوت است)
	// population: number(),
	// area_number: number(),

	// ...createUpdateAt,
};

export const township_relations = {
	registrer: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {},
	},
	province: {
		schemaName: "province",
		type: "single" as RelationDataType,
		optional: true,
		excludes: area_excludes,
		relatedRelations: {
			cities: {
				type: "multiple" as RelationDataType,
				limit: 50,
				excludes: area_excludes,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
};

export const townships = () =>
	coreApp.odm.newModel("township", township_pure, township_relations, {
		createIndex: {
			indexSpec: {
				area: "2dsphere",
				center_location: "2dsphere",
			},
		},
	});
