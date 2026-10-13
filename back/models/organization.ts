import { coreApp } from "../mod.ts";
import {
	array,
	boolean,
	defaulted,
	number,
	object,
	optional,
	type RelationDataType,
	type RelationSortOrderType,
	string,
} from "@deps";
import { createUpdateAt } from "../utils/createUpdateAt.ts";
import { geoJSONStruct, user_excludes } from "@model";

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
	// مرکز عملیاتی سازمان: نقطه‌ای که نقشه‌ی اپلیکیشن مأمور با آن باز می‌شود
	// (وقتی GPS در دسترس نیست) و از آن «مرکز سازمان» زده می‌شود.
	// ترتیب مختصات در GeoDB همیشه [longitude, latitude] است، نه [lat, lng].
	location: optional(geoJSONStruct("Point")),
	// بزرگ‌نمایی پیش‌فرض نقشه برای این سازمان. آزادراه کوتاه شهری ۱۶ می‌خواهد
	// و کریدور ۱۰۰ کیلومتری ۱۲؛ پس این عدد همراه نقطه می‌آید، نه داخل آن.
	// بازه‌ی ۳..۱۹ را مصرف‌کننده‌ها اعمال می‌کنند (نقشه‌ی وب و اپ مأمور).
	location_zoom: optional(number()),
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

	// `location` اختیاری است، پس ایندکس روی سندهای بدون نقطه هم ساخته می‌شود؛
	// MongoDB فیلد غایب را در ایندکس جغرافیایی نادیده می‌گیرد، نه اینکه خطا بدهد.
	coreApp.odm.getCollection("organization").createIndex({
		location: "2dsphere",
	});

	return model;
};
