import { coreApp } from "../mod.ts";
import {
	enums,
	type RelationDataType,
	type RelationSortOrderType,
	number,
	optional,
	string,
} from "@deps";
import { createUpdateAt } from "../utils/createUpdateAt.ts";
import { user_excludes } from "@model";

export const stock_movement_reason_array = [
	"goods_receipt",
	"goods_issue",
	"transfer_in",
	"transfer_out",
	"consumption",
	"adjustment",
	"return",
	"write_off",
];
export const stock_movement_reason_emums = enums(stock_movement_reason_array);

/**
 * StockMovement — تراکنش‌های موجودی (read-only، فقط توسط inventoryManager نوشته می‌شود).
 * `reference_type`/`reference_id` پلی‌مورفیک هستند (goodsReceipt | consumption | ...)
 * و عمداً ref خام نگه داشته می‌شوند (orphan-resilient — مطابق AGENTS.md).
 */
export const stock_movement_pure = {
	quantity: number(), // مثبت = ورود، منفی = خروج
	balance_before: number(),
	balance_after: number(),
	reason: stock_movement_reason_emums,
	reference_type: optional(string()), // "goodsReceipt" | "consumption" | ...
	reference_id: optional(string()), // polymorphic raw ref
	description: optional(string()),
	...createUpdateAt,
};

export const stock_movement_relations = {
	unit: {
		schemaName: "unit",
		type: "single" as RelationDataType,
		optional: false,
		relatedRelations: {
			stock_movements: {
				type: "multiple" as RelationDataType,
				limit: 200,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	created_by: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: false,
		excludes: user_excludes,
		relatedRelations: {
			created_stock_movements: {
				type: "multiple" as RelationDataType,
				limit: 200,
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
		optional: true,
		relatedRelations: {
			stock_movements: {
				type: "multiple" as RelationDataType,
				limit: 200,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
};

export const stock_movements = () =>
	coreApp.odm.newModel(
		"stock_movement",
		stock_movement_pure,
		stock_movement_relations,
	);
