import { coreApp } from "../mod.ts";
import {
	date,
	enums,
	optional,
	string,
	type RelationDataType,
} from "@deps";
import { createUpdateAt } from "../utils/createUpdateAt.ts";

export const accident_review_action_array = [
	"submitted",
	"started_review",
	"returned",
	"resubmitted",
	"approved",
	"completed",
	"reopened",
] as const;

export const accident_review_pure = {
	action: enums(accident_review_action_array),
	reason: optional(string()),
	action_at: date(),
	...createUpdateAt,
};

export const accident_review_relations = {
	accident: {
		schemaName: "accident",
		type: "single" as RelationDataType,
		optional: false,
		relatedRelations: {},
	},
	reviewer: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: false,
		relatedRelations: {},
	},
};

export const accident_reviews = () =>
	coreApp.odm.newModel(
		"accident_review",
		accident_review_pure,
		accident_review_relations,
	);
