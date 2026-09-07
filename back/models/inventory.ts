import { coreApp } from "../mod.ts";
import {
	coerce,
	date,
	defaulted,
	type RelationDataType,
	type RelationSortOrderType,
	number,
	optional,
	string,
} from "@deps";
import { createUpdateAt } from "../utils/createUpdateAt.ts";

/**
 * Inventory — موجودی کالا به ازای هر (unit, ware).
 *
 * D10 decided: ware-level granularity (unique compound index on unit+ware).
 * `min_quantity`/`max_quantity` are the JIT reorder point / safety ceiling.
 * Records are written ONLY through `utils/inventoryManager.ts` — no user act
 * touches this collection directly.
 */
export const inventory_pure = {
	quantity: defaulted(number(), 0),
	// نقطه سفارش مجدد (JIT)
	min_quantity: optional(number()),
	// سقف ایمنی / هدف JIT
	max_quantity: optional(number()),
	batch_no: optional(string()),
	expiration_date: optional(
		coerce(date(), string(), (value) => new Date(value)),
	),
	location: optional(string()), // "قفسه A، ردیف ۳"
	last_counted_at: optional(
		coerce(date(), string(), (value) => new Date(value)),
	),
	...createUpdateAt,
};

export const inventory_relations = {
	unit: {
		schemaName: "unit",
		type: "single" as RelationDataType,
		optional: false,
		relatedRelations: {
			inventories: {
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
			warehouseInventories: {
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
			inventories: {
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

export const inventories = () => {
	const model = coreApp.odm.newModel(
		"inventory",
		inventory_pure,
		inventory_relations,
	);

	coreApp.odm.getCollection("inventory").createIndex(
		{ "unit._id": 1, "ware._id": 1 },
		{ unique: true },
	);

	return model;
};
