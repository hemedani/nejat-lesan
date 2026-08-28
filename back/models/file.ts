import {
	number,
	optional,
	type RelationDataType,
	type RelationSortOrderType,
	string,
} from "@deps";
import { coreApp } from "../mod.ts";
import { createUpdateAt } from "@lib";
import { accident_excludes, user_excludes } from "@model";

export const file_category_array = [
	"plate",
	"insurance",
	"croquis",
	"facility_damage",
	"other",
] as const;

export const file_pure = {
	name: string(),
	type: string(),
	size: number(),
	category: optional(string()),
	sequence: optional(number()),
	...createUpdateAt,
};

export const file_excludes = ["createdAt", "updatedAt"];

export const file_relations = {
	uploader: {
		schemaName: "user",
		optional: false,
		type: "single" as RelationDataType,
		excludes: user_excludes,
		relatedRelations: {
			uploadedAssets: {
				type: "multiple" as RelationDataType,
				limit: 50,
				excludes: file_excludes,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	accident: {
		schemaName: "accident",
		type: "single" as RelationDataType,
		optional: true,
		excludes: accident_excludes,
		relatedRelations: {
			attachments: {
				type: "multiple" as RelationDataType,
				limit: 100,
				excludes: file_excludes,
				sort: {
					field: "_id",
					order: "asc" as RelationSortOrderType,
				},
			},
		},
	},
};

export const files = () =>
	coreApp.odm.newModel("file", file_pure, file_relations);
