import { coreApp } from "../mod.ts";
import {
	coerce,
	date,
	type RelationDataType,
	type RelationSortOrderType,
	number,
	optional,
	string,
} from "@deps";
import { createUpdateAt } from "../utils/createUpdateAt.ts";
import { user_excludes } from "@model";

/**
 * Consumption — مصرف کالا. `add` تریگر `inventoryManager.removeStock` است
 * (کاهش موجودی + ثبت stock_movement). `consumed_for` یک snapshot نام است.
 */
export const consumption_pure = {
	quantity: number(),
	consumed_at: coerce(date(), string(), (value) => new Date(value)),
	reason: optional(string()),
	consumed_for: optional(string()), // snapshot نام
	notes: optional(string()),
	...createUpdateAt,
};

export const consumption_relations = {
	unit: {
		schemaName: "unit",
		type: "single" as RelationDataType,
		optional: false,
		relatedRelations: {
			consumptions: {
				type: "multiple" as RelationDataType,
				limit: 100,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	consumed_by: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: false,
		excludes: user_excludes,
		relatedRelations: {
			consumptions: {
				type: "multiple" as RelationDataType,
				limit: 100,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	inventory: {
		schemaName: "inventory",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {
			consumptions: {
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
			consumptions: {
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

export const consumptions = () =>
	coreApp.odm.newModel(
		"consumption",
		consumption_pure,
		consumption_relations,
	);
