import { coreApp } from "../mod.ts";
import {
	boolean,
	coerce,
	date,
	defaulted,
	enums,
	type RelationDataType,
	type RelationSortOrderType,
	number,
	optional,
	string,
} from "@deps";
import { createUpdateAt } from "../utils/createUpdateAt.ts";
import { user_excludes } from "@model";

export const goods_request_status_array = [
	"draft",
	"pending",
	"approved",
	"issued",
	"received",
	"rejected",
];
export const goods_request_status_emums = enums(goods_request_status_array);

/**
 * GoodsRequest — درخواست تأمین JIT (کانبان بین واحدها).
 * چرخه: draft → pending → approved (رئیس واحد/سازمان) → issued (خروج از انبار)
 * → received (رسیدن به واحد مصرف‌کننده).
 * created by the `checkReorder` scan or a manual `add`.
 */
export const goods_request_pure = {
	serial: number(), // counter مشترک برای request_number
	request_number: string(), // REQ-{year}-{serial}
	status: defaulted(goods_request_status_emums, "draft"),
	quantity: number(), // مقدار درخواستی (replenish-to-ceiling)
	priority: defaulted(boolean(), false), // quantity <= min_quantity * 0.5
	requested_at: optional(coerce(date(), string(), (value) => new Date(value))),
	approved_at: optional(coerce(date(), string(), (value) => new Date(value))),
	issued_at: optional(coerce(date(), string(), (value) => new Date(value))),
	received_at: optional(coerce(date(), string(), (value) => new Date(value))),
	notes: optional(string()),
	// auto (reorder scan) | manual
	origin: optional(string()),
	...createUpdateAt,
};

export const goods_request_relations = {
	unit: {
		schemaName: "unit",
		type: "single" as RelationDataType,
		optional: false,
		relatedRelations: {
			goods_requests: {
				type: "multiple" as RelationDataType,
				limit: 100,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	warehouse_unit: {
		schemaName: "unit",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {
			warehouse_requests: {
				type: "multiple" as RelationDataType,
				limit: 100,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	ware: {
		schemaName: "ware",
		type: "single" as RelationDataType,
		optional: false,
		relatedRelations: {
			goods_requests: {
				type: "multiple" as RelationDataType,
				limit: 100,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	requested_by: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: false,
		excludes: user_excludes,
		relatedRelations: {
			requested_goods: {
				type: "multiple" as RelationDataType,
				limit: 100,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	approved_by: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: true,
		excludes: user_excludes,
		relatedRelations: {},
	},
};

export const goods_requests = () => {
	const model = coreApp.odm.newModel(
		"goods_request",
		goods_request_pure,
		goods_request_relations,
	);

	coreApp.odm.getCollection("goods_request").createIndex(
		{ "unit._id": 1, "ware._id": 1, status: 1 },
	);

	return model;
};
