import { coreApp } from "../mod.ts";
import {
	array,
	boolean,
	defaulted,
	enums,
	number,
	object,
	objectIdValidation,
	type RelationDataType,
	type RelationSortOrderType,
	optional,
	string,
	union,
} from "@deps";
import { createUpdateAt } from "../utils/createUpdateAt.ts";
import { user_excludes } from "@model";

export const accident_process_status_array = [
	"draft",
	"active",
	"archived",
];
export const accident_process_status_emums = enums(accident_process_status_array);

// همراستا با accident.incident_type
export const process_incident_type_array = [
	"accident",
	"road_breakdown",
	"road_obstacle",
	"other",
];
export const process_incident_type_emums = enums(process_incident_type_array);

/**
 * target_spec — D14: محل ذخیره پاسخ روی accident.
 *  - relation: path مانند "collision_type" | "road_defects" (نوع رابطه در ریجستری ثبت است)
 *  - dto:      داخل DTO مثل vehicle_dtos[].vehicle_type (نگاشت دقیق = follow-up)
 *  - dynamic:  → accident.dynamic_answers
 */
export const process_target_spec = union([
	object({ kind: enums(["relation"]), path: string() }),
	object({ kind: enums(["dto"]), dto: string(), field: string() }),
	object({ kind: enums(["dynamic"]) }),
]);

/**
 * question_schema — هر سؤال یک مدل دیتابیس را به‌عنوان منبع پاسخ صدا می‌زند
 * (model_name) و فقط زیرمجموعه‌ای از رکوردهای آن (allowed_answer_ids؛ خالی = همه)
 * را به‌عنوان گزینه نشان می‌دهد (نمونه «از ۵۰ رکورد فقط ۳ تا»).
 */
export const process_question_schema = object({
	key: string(), // uuid پایدار داخل پروسه (موبایل در ارسال به آن ارجاع می‌دهد)
	question: string(),
	description: optional(string()),
	icon: optional(string()),
	color: optional(string()),
	order: number(),
	required: defaulted(boolean(), true),
	// نام مدل منبع پاسخ — در activateProcess باید عضو questionRegistry باشد
	model_name: string(),
	// خالی = همه رکوردهای مدل؛ غیرخالی = فقط همین‌ها
	allowed_answer_ids: defaulted(array(objectIdValidation), []),
	multi_select: defaulted(boolean(), false),
	target: process_target_spec,
});

export const process_step_schema = object({
	key: string(),
	title: string(),
	description: optional(string()),
	icon: optional(string()),
	color: optional(string()),
	order: number(), // 1..N پیوسته — activateProcess اعتبارسنجی می‌کند
	required: defaulted(boolean(), false),
	questions: defaulted(array(process_question_schema), []),
});

/**
 * AccidentProcess — ویزارد ثبت گزارش سازمان (هر آزادراه فرآیند خود را طراحی می‌کند).
 * گام‌ها و سؤال‌ها به‌صورت توکار (embedded) نگه داشته می‌شوند (D15).
 * در هر org(+incident_type) فقط یک نسخه فعال مجاز است (D18).
 */
export const accident_process_pure = {
	name: string(),
	description: optional(string()),
	status: defaulted(accident_process_status_emums, "draft"),
	version: defaulted(number(), 1), // با هر activate یکی زیاد می‌شود
	is_active: defaulted(boolean(), false),
	// خالی = برای همه انواع رخداد
	incident_type: optional(process_incident_type_emums),
	steps: defaulted(array(process_step_schema), []),
	...createUpdateAt,
};

export const accident_process_relations = {
	organization: {
		schemaName: "organization",
		type: "single" as RelationDataType,
		optional: false,
		relatedRelations: {
			accident_processes: {
				type: "multiple" as RelationDataType,
				limit: 20,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
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

export const accident_processes = () => {
	const model = coreApp.odm.newModel(
		"accident_process",
		accident_process_pure,
		accident_process_relations,
	);

	// یک پروسه فعال به ازای هر (سازمان، نوع رخداد). در activateProcess هم
	// چک نرم‌افزاری با پیام فارسی انجام می‌شود؛ این ایندکس ضمانت پایگاه‌داده است.
	coreApp.odm.getCollection("accident_process").createIndex(
		{ "organization._id": 1, incident_type: 1 },
		{
			unique: true,
			partialFilterExpression: { status: "active" },
		},
	);

	return model;
};
