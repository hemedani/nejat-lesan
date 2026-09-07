import { coreApp } from "../mod.ts";
import {
	array,
	boolean,
	coerce,
	date,
	defaulted,
	enums,
	number,
	object,
	objectIdValidation,
	optional,
	pattern,
	refine,
	type RelationDataType,
	type RelationSortOrderType,
	string,
	union,
} from "@deps";
import { createUpdateAt, isValidNationalNumber } from "@lib";
import { geoJSONStruct } from "@model";
import {
	accidentSeverityAnalyticFilters,
	areaUsageAnalyticFilters,
	collisionAnalyticFilters,
	companyPerformanceAnalyticFilters,
	eventCollisionAnalyticFilters,
	eventSeverityAnalyticFilters,
	hourlyDayOfWeekAnalyticFilters,
	humanReasonAnalyticFilters,
	mapAccidentsAnalyticFilters,
	monthlyHolidayAnalyticFilters,
	roadDefectsAnalyticFilters,
	spatialCollisionAnalyticFilters,
	spatialLightAnalyticFilters,
	spatialSafetyIndexAnalyticFilters,
	spatialSeverityAnalyticFilters,
	spatialSingleVehicleAnalyticFilters,
	temporalCollisionAnalyticFilters,
	temporalCountAnalyticFilters,
	temporalDamageAnalyticFilters,
	temporalNightAnalyticFilters,
	temporalSeverityAnalyticFilters,
	temporalTotalReasonAnalyticFilters,
	temporalUnlicensedDriversAnalyticFilters,
	totalReasonAnalyticFilters,
	vehicleReasonAnalyticFilters,
} from "./utils/accidentFilters.ts";

export const availableCharts = optional(object({
	accidentSeverityAnalytics: optional(accidentSeverityAnalyticFilters),
	areaUsageAnalytics: optional(areaUsageAnalyticFilters),
	collisionAnalytics: optional(collisionAnalyticFilters),
	companyPerformanceAnalytics: optional(
		companyPerformanceAnalyticFilters,
	),
	eventCollisionAnalytics: optional(eventCollisionAnalyticFilters),
	eventSeverityAnalytics: optional(eventSeverityAnalyticFilters),
	hourlyDayOfWeekAnalytics: optional(hourlyDayOfWeekAnalyticFilters),
	humanReasonAnalytics: optional(humanReasonAnalyticFilters),
	monthlyHolidayAnalytics: optional(monthlyHolidayAnalyticFilters),
	roadDefectsAnalytics: optional(roadDefectsAnalyticFilters),
	spatialCollisionAnalytics: optional(spatialCollisionAnalyticFilters),
	spatialLightAnalytics: optional(spatialLightAnalyticFilters),
	spatialSafetyIndexAnalytics: optional(
		spatialSafetyIndexAnalyticFilters,
	),
	spatialSeverityAnalytics: optional(spatialSeverityAnalyticFilters),
	spatialSingleVehicleAnalytics: optional(
		spatialSingleVehicleAnalyticFilters,
	),
	temporalCollisionAnalytics: optional(temporalCollisionAnalyticFilters),
	temporalCountAnalytics: optional(temporalCountAnalyticFilters),
	temporalDamageAnalytics: optional(temporalDamageAnalyticFilters),
	temporalNightAnalytics: optional(temporalNightAnalyticFilters),
	temporalSeverityAnalytics: optional(temporalSeverityAnalyticFilters),
	temporalTotalReasonAnalytics: optional(
		temporalTotalReasonAnalyticFilters,
	),
	temporalUnlicensedDriversAnalytics: optional(
		temporalUnlicensedDriversAnalyticFilters,
	),
	totalReasonAnalytics: optional(totalReasonAnalyticFilters),
	vehicleReasonAnalytics: optional(vehicleReasonAnalyticFilters),
	mapAccidentsAnalytics: optional(mapAccidentsAnalyticFilters),
}));

export const user_level_array = [
	"Ghost",
	"Manager",
	"OrgHead",
	"UnitHead",
	"Editor",
	"Enterprise",
	"Patrol",
];
export const user_level_emums = enums(user_level_array);

// Levels reserved for organization-leader workspaces (routing + gate opening).
export const user_org_leader_levels = ["OrgHead", "UnitHead"];
export const user_org_role_array = ["OrgHead", "UnitHead", "Officer"];

// --- Org/unit roles (D7) ---
// Backward-compatible: existing users simply carry an empty `roles` array and
// `level` stays the coarse auth gate (Patrol device login, Ghost bootstrap).
// Org/unit scoping (OrgHead, UnitHead, Officer, ...) lives in `roles`.
export const user_role_array = [
	"Ghost",
	"Manager",
	"OrgHead",
	"UnitHead",
	"Officer",
	"Editor",
	"Enterprise",
	"Patrol",
];
export const user_role_emums = enums(user_role_array);
export const role_scope_type_emums = enums(["organization", "unit"]);

export const user_role_struct = object({
	roleId: string(), // uuid
	name: user_role_emums,
	scopeType: optional(role_scope_type_emums),
	scopeId: optional(string()),
});

export const patrol_permissions_struct = object({
	can_submit_accident: optional(boolean()),
	can_view_map: optional(boolean()),
	can_receive_announcements: optional(boolean()),
	can_register_emergency: optional(boolean()),
	can_view_reports: optional(boolean()),
});

export const personnel_code_pattern = pattern(string(), /^[0-9]+$/);

export const mobile_pattern = pattern(
	string(),
	/(\+98|0|98|0098)?([ ]|-|[()]){0,2}9[0-9]([ ]|-|[()]){0,2}(?:[0-9]([ ]|-|[()]){0,2}){8}/,
);

export const emailPattern = pattern(
	string(),
	/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
);

export const is_valid_national_number_struct = refine(
	union([string(), number()]),
	"national_number",
	(value: string | number) => {
		const normalized = String(value).trim();
		return isValidNationalNumber(normalized);
	},
);

// export const is_valid_national_number_struct = define<string>(
// 	"NationalNumber",
// 	(value) => {
// 		if (
// 			typeof value !== "string" && typeof value !== "number"
// 		) return false;
// 		const str = String(value).trim();
// 		return isValidNationalNumber(str);
// 	},
// );

export const user_genders = enums(["Male", "Female"]);

export const user_pure = {
	first_name: string(),
	last_name: string(),
	father_name: string(),
	mobile: mobile_pattern,
	gender: user_genders,
	birth_date: optional(coerce(date(), string(), (value) => new Date(value))),
	summary: optional(string()),
	email: emailPattern,
	password: optional(string()),

	// شماره ملی
	national_number: optional(is_valid_national_number_struct),
	address: string(),

	level: user_level_emums,
	is_verified: defaulted(boolean(), false),
	// کد پرسنلی (فقط عددی) — مخصوص ورود مأمور گشت
	personnel_code: optional(personnel_code_pattern),
	is_active: defaulted(boolean(), true),
	// دسترسی‌های پویای مأمور گشت که پس از ورود به اپ موبایل بازگردانده می‌شود
	patrol_permissions: optional(patrol_permissions_struct),
	// نقش‌های سازمانی/واحدی (سطح سازمان = OrgHead، سطح واحد = UnitHead، ...)
	roles: defaulted(array(user_role_struct), []),
	// سیاست قفل شدن پس از تلاش‌های ناموفق ورود
	failed_login_attempts: defaulted(number(), 0),
	locked_until: optional(date()),
	settings: object({
		cities: array(object({
			_id: objectIdValidation,
			name: string(),
			center_location: geoJSONStruct("Point"),
		})),
		provinces: array(object({
			_id: objectIdValidation,
			name: string(),
			center_location: geoJSONStruct("Point"),
		})),
		availableCharts,
	}),
	...createUpdateAt,
};

export const user_excludes = [
	"summary",
	"createdAt",
	"updatedAt",
	"settings",
	"birth_date",
	"password",
];

export const user_relations = {
	avatar: {
		schemaName: "file",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {},
	},
	national_card: {
		schemaName: "file",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {},
	},
	// Membership in organizations/units (reverses `members` on both).
	// Leadership is separate (organization.head / unit.head).
	organizations: {
		schemaName: "organization",
		type: "multiple" as RelationDataType,
		optional: true,
		limit: 50,
		relatedRelations: {
			members: {
				type: "multiple" as RelationDataType,
				limit: 200,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
	units: {
		schemaName: "unit",
		type: "multiple" as RelationDataType,
		optional: true,
		limit: 50,
		relatedRelations: {
			members: {
				type: "multiple" as RelationDataType,
				limit: 200,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
};

export const users = () => {
	const model = coreApp.odm.newModel("user", user_pure, user_relations, {
		createIndex: {
			indexSpec: { "email": 1 },
			options: { unique: true, sparse: true },
		},
		excludes: ["password"],
	});

	coreApp.odm.getCollection("user").createIndex(
		{ personnel_code: 1 },
		{ unique: true, sparse: true },
	);

	return model;
};
