import {
	number,
	optional,
	type RelationDataType,
	type RelationSortOrderType,
	string,
} from "@deps";
import { coreApp } from "../mod.ts";
import { createUpdateAt } from "@lib";
import {
	accident_excludes,
	incident_report_excludes,
	user_excludes,
} from "@model";

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
	/**
	 * Where the bytes were written, relative to `./uploads` — e.g.
	 * `images/<name>` or `accidents/<name>`.
	 *
	 * `name` alone is not enough to fetch a file back: two acts write to two
	 * different trees (`file.uploadFile` picks a directory from its declared
	 * type, `file.uploadAccidentImages` always writes `accidents`), and the
	 * directory was never recorded. A reader had to infer it from the relation
	 * it arrived through, which is why only `accident.attachments` could be
	 * rendered. Optional so documents written before this field existed stay
	 * valid; readers fall back to `accidents/<name>` for those.
	 */
	path: optional(string()),
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
	// The same relation a second kind of report owns.
	//
	// The key is `attachments` on both sides rather than the `incident_reports`
	// convention the rest of `incident_report` uses: that convention exists only
	// because `accidents` is already claimed by `accident` on `user`, `vehicle` and
	// friends, and Lesan forbids two models claiming the same reverse. `file` claims
	// nothing, so there is no collision to route around.
	incident_report: {
		schemaName: "incident_report",
		type: "single" as RelationDataType,
		optional: true,
		excludes: incident_report_excludes,
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
