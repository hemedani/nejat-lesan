import { coreApp } from "../mod.ts";
import {
	type RelationDataType,
	type RelationSortOrderType,
	string,
} from "@deps";
import { geoJSONStruct } from "./province.ts";
import { createUpdateAt } from "../utils/createUpdateAt.ts";

export const axes_pure = {
	name: string(),
	area: geoJSONStruct("Polygon"), // -- محدوده بومی (اگر متفاوت است)

	...createUpdateAt,
};

export const axes_relations = {
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
			axeses: {
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

export const axeses = () =>
	coreApp.odm.newModel("axes", axes_pure, axes_relations);
