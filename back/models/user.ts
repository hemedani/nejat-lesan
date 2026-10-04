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

	// `.catch()` because this promise is never awaited: `users()` runs during
	// `functionsSetup`, and an unhandled rejection there takes the whole process
	// down. It is sparse, so existing data does not violate it, but a suite that
	// drops a collection while this build is in flight aborts it — which is the
	// intermittent `Index build failed … is being dropped` in the test suites.
	coreApp.odm.getCollection("user").createIndex(
		{ personnel_code: 1 },
		{ unique: true, sparse: true },
	).catch(() => {
		// A missing index costs uniqueness on an optional field, not correctness
		// of the server. `applyUserIndexMigrations` covers the legacy index.
	});

	return model;
};

/**
 * The index an older version of this schema created for `national_number`.
 *
 * It is unique and NOT sparse, which is the whole problem: Mongo admits exactly
 * one document with a missing or null value under such an index, so the second
 * user without a national number could never be inserted. Nothing declares it
 * any more — `users()` creates only the `email` and `personnel_code` indexes,
 * both sparse — so it survives only in databases created before that changed.
 */
const LEGACY_NATIONAL_NUMBER_INDEX = "national_number_1";

/**
 * Drop the unique-but-not-sparse `national_number` index left by an older
 * schema.
 *
 * `createIndex` only ever adds, so an existing database keeps this index
 * forever no matter what the model says. Nothing in the test suite can catch
 * it either, because each suite drops its database and therefore never sees the
 * old index — which is exactly why it belongs in a migration rather than in
 * `users()`.
 *
 * Dropping it is not a loss of integrity. `national_number` is
 * `optional(is_valid_national_number_struct)` and nothing enforces it being
 * present or unique today. The real failure it caused was a hard `E11000` on
 * any user inserted without a national number — including every user
 * `user.seedDemoOrganization` creates.
 */
export const applyUserIndexMigrations = async (): Promise<void> => {
	const collection = coreApp.odm.getCollection("user");

	try {
		const indexes = await collection.indexes();
		if (
			indexes.some((index) => index.name === LEGACY_NATIONAL_NUMBER_INDEX)
		) {
			await collection.dropIndex(LEGACY_NATIONAL_NUMBER_INDEX);
		}
	} catch {
		// A failed drop must not stop the process from serving. The worst case is
		// that the stale cap persists until an operator drops it by hand; the
		// indexes this schema does declare are created regardless.
	}
};
