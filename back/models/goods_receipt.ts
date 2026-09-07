import { coreApp } from "../mod.ts";
import {
	array,
	boolean,
	coerce,
	date,
	defaulted,
	enums,
	number,
	object,
	objectIdValidation,
	type RelationDataType,
	type RelationSortOrderType,
	optional,
	string,
} from "@deps";
import { createUpdateAt } from "../utils/createUpdateAt.ts";
import { user_excludes } from "@model";

export const goods_receipt_status_array = [
	"pending",
	"completed",
	"partially_rejected",
];
export const goods_receipt_status_emums = enums(goods_receipt_status_array);

export const goods_receipt_item_struct = object({
	ware_id: optional(objectIdValidation), // raw ref (embedded array — relations can't live here)
	ware_name: optional(string()),
	quantity_received: number(),
	quantity_accepted: number(),
	quantity_rejected: number(),
	batch_no: optional(string()),
	expiration_date: optional(
		coerce(date(), string(), (value) => new Date(value)),
	),
});

/**
 * GoodsReceipt — رسید کالا. `add` تریگر `inventoryManager.addStock` است.
 * شماره رسید خودکار `GR-{year}-{serial}`.
 * فیلدهای `cross_dock`/`target_unit` برای JIT (فاز ۵) روی مدل هستند؛ رفتار
 * cross-dock در فاز ۵ فعال می‌شود (در حال حاضر کالا به receiving_unit می‌رود).
 */
export const goods_receipt_pure = {
	serial: number(), // counter مشترک برای تولید receipt_number
	receipt_number: string(),
	received_at: coerce(date(), string(), (value) => new Date(value)),
	status: defaulted(goods_receipt_status_emums, "pending"),
	notes: optional(string()),
	items: defaulted(array(goods_receipt_item_struct), []),
	// JIT (Phase 5)
	cross_dock: defaulted(boolean(), false),
	...createUpdateAt,
};

export const goods_receipt_relations = {
	received_by: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: false,
		excludes: user_excludes,
		relatedRelations: {
			received_goods: {
				type: "multiple" as RelationDataType,
				limit: 100,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	receiving_unit: {
		schemaName: "unit",
		type: "single" as RelationDataType,
		optional: false,
		relatedRelations: {
			goods_receipts: {
				type: "multiple" as RelationDataType,
				limit: 100,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	target_unit: {
		schemaName: "unit",
		type: "single" as RelationDataType,
		optional: true, // JIT cross-dock (Phase 5)
		relatedRelations: {
			cross_dock_receipts: {
				type: "multiple" as RelationDataType,
				limit: 100,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
};

export const goods_receipts = () =>
	coreApp.odm.newModel(
		"goods_receipt",
		goods_receipt_pure,
		goods_receipt_relations,
	);
