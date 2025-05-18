import { coreApp } from "../mod.ts";
import {
	array,
	number,
	optional,
	type RelationDataType,
	string,
	tuple,
} from "@deps";
import { createUpdateAt } from "@lib";

export const countryPure = {
	name: string(),
	description: optional(string()),

	area: array(tuple([number(), number()])),

	...createUpdateAt,
};

export const countryRelations = {
	registrer: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {},
	},
};

export const countries = () =>
	coreApp.odm.newModel("country", countryPure, countryRelations);
