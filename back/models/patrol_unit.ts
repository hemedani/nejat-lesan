import { coreApp } from "../mod.ts";
import {
	boolean,
	defaulted,
	type RelationDataType,
	type RelationSortOrderType,
	string,
} from "@deps";
import { createUpdateAt } from "../utils/createUpdateAt.ts";

export const patrol_unit_pure = {
	code: string(),
	name: string(),
	is_active: defaulted(boolean(), true),

	...createUpdateAt,
};

export const patrol_unit_relations = {
	registrer: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {},
	},
	police_station: {
		schemaName: "police_station",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {
			patrol_units: {
				type: "multiple" as RelationDataType,
				limit: 50,
				sort: { field: "_id", order: "desc" as RelationSortOrderType },
			},
		},
	},
	vehicles: {
		schemaName: "vehicle",
		type: "multiple" as RelationDataType,
		optional: true,
		limit: 20,
		sort: { field: "_id", order: "desc" as RelationSortOrderType },
		relatedRelations: {
			patrol_unit: {
				type: "single" as RelationDataType,
			},
		},
	},
	officers: {
		schemaName: "user",
		type: "multiple" as RelationDataType,
		optional: true,
		limit: 50,
		sort: { field: "_id", order: "desc" as RelationSortOrderType },
		relatedRelations: {
			patrol_unit: {
				type: "single" as RelationDataType,
			},
		},
	},
};

export const patrol_units = () =>
	coreApp.odm.newModel(
		"patrol_unit",
		patrol_unit_pure,
		patrol_unit_relations,
	);