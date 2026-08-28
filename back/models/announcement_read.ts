import { coreApp } from "../mod.ts";
import {
	date,
	defaulted,
	type RelationDataType,
	type RelationSortOrderType,
} from "@deps";
import { createUpdateAt } from "../utils/createUpdateAt.ts";
import { user_excludes } from "./user.ts";

/**
 * وضعیت خواندن اعلامیه به ازای هر کاربر.
 * برای هر جفت (کاربر، اعلامیه) حداکثر یک سند ذخیره می‌شود.
 *
 * به‌جای ذخیره‌سازی «شناسه خام» اعلامیه (announcement_id)، رابطه‌ی تک‌طرفه‌ی
 * `announcement` تعریف شده است؛ چون هر اعلامیه می‌تواند به ده‌ها/صدها مأمور
 * ارسال شود، خوانش‌ها در مدل جدا نگه داشته می‌شوند تا سند اعلامیه بزرگ نشود.
 */
export const announcement_read_pure = {
	read_at: defaulted(date(), () => new Date()),

	...createUpdateAt,
};

export const announcement_read_relations = {
	announcement: {
		schemaName: "announcement",
		type: "single" as RelationDataType,
		optional: false,
		relatedRelations: {
			reads: {
				type: "multiple" as RelationDataType,
				limit: 500,
				excludes: ["createdAt", "updatedAt"],
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	reader: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: false,
		excludes: user_excludes,
		relatedRelations: {
			announcement_reads: {
				type: "multiple" as RelationDataType,
				limit: 200,
				excludes: ["createdAt", "updatedAt"],
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
};

export const announcement_reads = () =>
	coreApp.odm.newModel(
		"announcement_read",
		announcement_read_pure,
		announcement_read_relations,
		{
			createIndex: {
				indexSpec: { "announcement._id": 1, "reader._id": 1 },
				options: { unique: true },
			},
		},
	);
