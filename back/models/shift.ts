import { coreApp } from "../mod.ts";
import {
	date,
	defaulted,
	enums,
	optional,
	type RelationDataType,
	type RelationSortOrderType,
	string,
} from "@deps";
import { createUpdateAt } from "../utils/createUpdateAt.ts";

export const shift_status_array = ["active", "ended", "cancelled"] as const;
export const shift_status_emums = enums(shift_status_array);

export const shift_pure = {
	shift_type: string(),
	status: defaulted(shift_status_emums, "active"),
	start_at: date(),
	end_at: optional(date()),
	note: optional(string()),

	...createUpdateAt,
};

export const shift_relations = {
	registrer: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {},
	},
	officer: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: false,
		relatedRelations: {
			shifts: {
				type: "multiple" as RelationDataType,
				limit: 100,
				sort: { field: "_id", order: "desc" as RelationSortOrderType },
			},
		},
	},
	patrol_unit: {
		schemaName: "patrol_unit",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {
			shifts: {
				type: "multiple" as RelationDataType,
				limit: 100,
				sort: { field: "_id", order: "desc" as RelationSortOrderType },
			},
		},
	},
	vehicle: {
		schemaName: "vehicle",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {
			shifts: {
				type: "multiple" as RelationDataType,
				limit: 100,
				sort: { field: "_id", order: "desc" as RelationSortOrderType },
			},
		},
	},
};

export const shifts = () =>
	coreApp.odm.newModel("shift", shift_pure, shift_relations);
