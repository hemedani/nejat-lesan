import { coreApp } from "../mod.ts";
import {
	array,
	boolean,
	date,
	defaulted,
	enums,
	optional,
	type RelationDataType,
	type RelationSortOrderType,
	string,
} from "@deps";
import { createUpdateAt } from "../utils/createUpdateAt.ts";
import { file_excludes } from "./file.ts";
import { user_excludes } from "./user.ts";

export const announcement_priority_array = ["info", "warning", "critical"] as const;
export const announcement_priority_enums = enums(announcement_priority_array);

export const announcement_pure = {
	title: string(),
	body: string(),
	priority: defaulted(announcement_priority_enums, "info"),
	target_roles: defaulted(array(string()), []),
	target_user_ids: optional(array(string())),
	target_patrol_units: optional(array(string())),
	expires_at: optional(date()),
	is_active: defaulted(boolean(), true),

	...createUpdateAt,
};

export const announcement_relations = {
	registrer: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: true,
		excludes: user_excludes,
		relatedRelations: {},
	},
	attachments: {
		schemaName: "file",
		type: "multiple" as RelationDataType,
		optional: true,
		excludes: file_excludes,
		relatedRelations: {},
	},
};

export const announcements = () =>
	coreApp.odm.newModel("announcement", announcement_pure, announcement_relations);