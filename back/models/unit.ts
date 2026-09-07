import { coreApp } from "../mod.ts";
import {
	array,
	boolean,
	defaulted,
	enums,
	object,
	optional,
	type RelationDataType,
	type RelationSortOrderType,
	string,
} from "@deps";
import { createUpdateAt } from "../utils/createUpdateAt.ts";
import { user_excludes } from "@model";

export const unit_type_array = [
	"Patrol",
	"Station",
	"Ops",
	"Maintenance",
	"Logistics",
	"Administration",
	"Warehouse",
	"General",
];
export const unit_type_emums = enums(unit_type_array);

/**
 * Unit — گره درخت سازمانی (نمودار سازمانی هر آزادراه/شهرداری).
 * جایگزین مدل‌های تخت patrol_unit و police_station: هر گره نوع مشخصی دارد
 * (گشت، پاسگاه، بهره‌برداری، نگهداری، لجستیک، اداری، انبار، عمومی) و
 * `organization` + `road` به‌صورت denormalized روی هر گره نگهداری می‌شود
 * (convention این ریپو) تا پرس‌وجوها تک‌سند باشند. `road` اختیاری است و فقط
 * وقتی معنا دارد که سازمانِ والد به راهی گره خورده باشد (واحدهای سازمان‌های
 * شهرداری بدون راه‌اند).
 * `parentUnit` درخت بی‌نهایت را می‌سازد؛ `head` رئیس/فرمانده گره است.
 */
export const unit_pure = {
	code: string(),
	name: string(),
	description: optional(string()),
	is_active: defaulted(boolean(), true),
	type: defaulted(unit_type_emums, "General"),
	address: optional(string()),
	phone: optional(string()),
	// عنوان سمت (رئیس، فرمانده، سرگشت...)
	head_title: optional(string()),
	features: defaulted(array(object({ feature: string() })), []),
	...createUpdateAt,
};

export const unit_relations = {
	organization: {
		schemaName: "organization",
		type: "single" as RelationDataType,
		optional: false,
		relatedRelations: {
			units: {
				type: "multiple" as RelationDataType,
				limit: 200,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	road: {
		schemaName: "road",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {
			units: {
				type: "multiple" as RelationDataType,
				limit: 200,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	parentUnit: {
		schemaName: "unit",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {
			subUnits: {
				type: "multiple" as RelationDataType,
				limit: 200,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	head: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: true,
		excludes: user_excludes,
		relatedRelations: {
			headedUnits: {
				type: "multiple" as RelationDataType,
				limit: 50,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	// migrated from patrol_unit
	vehicles: {
		schemaName: "vehicle",
		type: "multiple" as RelationDataType,
		optional: true,
		limit: 20,
		relatedRelations: {
			unit: {
				type: "single" as RelationDataType,
			},
		},
	},
	officers: {
		schemaName: "user",
		type: "multiple" as RelationDataType,
		optional: true,
		limit: 50,
		relatedRelations: {
			unit: {
				type: "single" as RelationDataType,
			},
		},
	},
	registrer: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: true,
		excludes: user_excludes,
		relatedRelations: {},
	},
};

export const units = () => {
	const model = coreApp.odm.newModel("unit", unit_pure, unit_relations, {
		createIndex: {
			indexSpec: { "organization._id": 1, type: 1 },
		},
	});

	coreApp.odm.getCollection("unit").createIndex({
		code: "text",
		name: "text",
	});

	return model;
};
