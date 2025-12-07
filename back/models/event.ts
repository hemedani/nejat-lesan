import { coreApp } from "../mod.ts";
import { array, type RelationDataType, string } from "@deps";
import { user_excludes } from "@model";

// Define the tuple type for date range: [startDate, endDate]
export type DateRange = [string, string];

export const event_pure = {
	name: string(), // Name of the event
	description: string(), // Description of the event
	dates: array(array(string())), // Array of date ranges [[startDate, endDate], [startDate, endDate], ...]
};

export const event_relations = {
	registrer: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: true,
		excludes: user_excludes,
		relatedRelations: {},
	},
};

export const events = () =>
	coreApp.odm.newModel("event", event_pure, event_relations);
