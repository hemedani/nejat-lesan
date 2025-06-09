import { coreApp } from "../mod.ts";
import {
	date,
	type RelationDataType,
	type RelationSortOrderType,
	string,
} from "@deps";
import { createUpdateAt } from "../utils/createUpdateAt.ts";

export const event_process_pure = {
	caption: string(),
	start_date: date(),
	end_date: date(),

	...createUpdateAt,
};

export const event_process_relations = {
	registrer: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {
			registred_events: {
				type: "multiple" as RelationDataType,
				limit: 50,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
};

export const event_processes = () =>
	coreApp.odm.newModel(
		"event_process",
		event_process_pure,
		event_process_relations,
	);
