import { coreApp } from "../mod.ts";
import {
	array,
	boolean,
	defaulted,
	object,
	optional,
	type RelationDataType,
	type RelationSortOrderType,
	string,
} from "@deps";
import { createUpdateAt } from "../utils/createUpdateAt.ts";
import { user_excludes } from "@model";

/**
 * Organization — هر راه/بزرگراه/آزادراه یا شهرداری یک سازمان.
 * Lifecycle/people separate from its geometry/linear referencing.
 * The `road` relation is an optional 1:1 — freeway/highway orgs bind to exactly
 * one road; municipality orgs (whole-city coverage) stay roadless. When set,
 * `road.organization` (reverse) lets accident/nearbyAccidents scope to "this
 * org's road" through the existing `road` relation.
 */
export const organization_pure = {
	code: string(), // e.g. "A1-تهران-قم"
	name: string(), // نام آزادراه / سازمان
	enName: optional(string()),
	description: optional(string()),
	is_active: defaulted(boolean(), true),
	// پرچم‌های ماژول این سازمان (مجوز فروش سطح سازمان).
	// غیاب = ارث‌بری از سطح نصب (همه فعال). فقط Ghost تغییر می‌دهد.
	module_flags: optional(array(object({
		key: string(),
		enabled: boolean(),
	}))),
	...createUpdateAt,
};

export const organization_relations = {
	road: {
		schemaName: "road",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {
			organization: {
				type: "single" as RelationDataType,
			},
		},
	},
	head: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: true,
		excludes: user_excludes,
		relatedRelations: {},
	},
	logo: {
		schemaName: "file",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {},
	},
	registrer: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: true,
		excludes: user_excludes,
		relatedRelations: {},
	},
};

export const organizations = () => {
	const model = coreApp.odm.newModel(
		"organization",
		organization_pure,
		organization_relations,
		{
			createIndex: {
				indexSpec: { code: 1 },
				options: { unique: true },
			},
		},
	);

	coreApp.odm.getCollection("organization").createIndex({
		name: "text",
		enName: "text",
	});

	return model;
};
