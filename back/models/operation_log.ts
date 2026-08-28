import { coreApp } from "../mod.ts";
import { optional, type RelationDataType, string } from "@deps";
import { createUpdateAt } from "../utils/createUpdateAt.ts";

/**
 * لاگ ممیزی (Audit Log) عملیات مدیریتی گشت.
 * برای هر جهش روابط/تخصیص‌ها یک رکورد ثبت می‌شود.
 */
export const operation_log_pure = {
	action: string(), // مثلاً "patrol_unit.updateRelations"
	entity_type: string(), // مثلاً "patrol_unit"
	entity_id: string(), // شناسه سند هدف
	summary: optional(string()), // خلاصه فارسی تغییرات
	changes: optional(string()), // توضیح ساختاریافته تغییرات (JSON)
	...createUpdateAt,
};

export const operation_log_relations = {
	actor: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {},
	},
};

export const operation_logs = () =>
	coreApp.odm.newModel(
		"operation_log",
		operation_log_pure,
		operation_log_relations,
	);
