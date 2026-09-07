import { ObjectId } from "@deps";
import { coreApp, organization, unit, user } from "../mod.ts";
import { getScopedOrgIds } from "../src/app_modules/orgScope.ts";
import { throwError } from "./throwError.ts";
import { user_org_leader_levels, user_org_role_array } from "../models/user.ts";

type ActorUser = {
	_id: unknown;
	level?: string;
	roles?: Array<{
		roleId?: string;
		name?: string;
		scopeType?: string;
		scopeId?: string;
	}>;
};

export type OrgRoleInput = {
	name: string;
	scopeType?: "organization" | "unit";
	scopeId?: string;
};

export const GLOBAL_LEVELS = ["Ghost", "Manager"];

export const isGlobalManager = (user: ActorUser): boolean =>
	GLOBAL_LEVELS.includes(user.level as string);

export const isOrgLeader = (user: ActorUser): boolean =>
	user_org_leader_levels.includes((user as { level: string }).level) &&
	!!(user.roles || []).some((r) => r.scopeType && r.scopeId);

/** orgId های قابل مدیریتِ اکشن‌ساز (null = سراسری/نامحدود). */
export const getAllowedManagerOrgIds = async (
	user: ActorUser,
): Promise<string[] | null> => {
	if (isGlobalManager(user)) return null;
	return await getScopedOrgIds(user);
};

export const assertOrgInActorScope = async (
	user: ActorUser,
	orgId: string | undefined,
): Promise<void> => {
	if (isGlobalManager(user)) return;
	if (!orgId) {
		return throwError("شناسه سازمان الزامی است");
	}
	const allowed = await getAllowedManagerOrgIds(user);
	if (!allowed || !allowed.includes(orgId)) {
		return throwError("شما به این سازمان دسترسی ندارید");
	}
};

const unitOrgId = async (unitId: string): Promise<string | null> => {
	const u = await unit.findOne({
		filters: { _id: new ObjectId(unitId) },
		projection: { _id: 1, "organization._id": 1 },
	});
	return (u as { organization?: { _id?: ObjectId } } | null)?.organization
		?._id
		?.toString() || null;
};

/**
 * اعتبارسنجی نقش‌های سازمانی قابل انتصاب:
 * - فقط OrgHead (organization)، UnitHead و Officer (unit) مجاز است.
 * - scope باید وجود داشته باشد و برای غیر سراسری‌ها در محدوده‌ی اکشن‌ساز باشد.
 */
export const assertRolesAssignable = async (
	actor: ActorUser,
	roles: OrgRoleInput[],
): Promise<void> => {
	for (const role of roles) {
		if (!user_org_role_array.includes(role.name)) {
			return throwError(
				"فقط نقش‌های سازمانی (سرپرست آزادراه/واحد/مامور) قابل انتصاب است",
			);
		}
		if (role.name === "OrgHead") {
			if (role.scopeType !== "organization" || !role.scopeId) {
				return throwError(
					"نقش سرپرست آزادراه باید به یک سازمان گره بخورد",
				);
			}
			await assertOrgInActorScope(actor, role.scopeId);
			const org = await organization.findOne({
				filters: { _id: new ObjectId(role.scopeId) },
				projection: { _id: 1 },
			});
			if (!org) return throwError("سازمان نقش یافت نشد");
		} else {
			if (role.scopeType !== "unit" || !role.scopeId) {
				return throwError("نقش واحد/مامور باید به یک واحد گره بخورد");
			}
			const orgId = await unitOrgId(role.scopeId);
			if (!orgId) return throwError("واحد نقش یافت نشد");
			await assertOrgInActorScope(actor, orgId);
		}
	}
};

export const isRoleWithinActorScope = async (
	actor: ActorUser,
	role: OrgRoleInput,
): Promise<boolean> => {
	if (isGlobalManager(actor)) return true;
	const allowed = await getAllowedManagerOrgIds(actor);
	if (!allowed) return false;
	if (role.scopeType === "organization") {
		return !!role.scopeId && allowed.includes(role.scopeId);
	}
	if (role.scopeType === "unit" && role.scopeId) {
		const orgId = await unitOrgId(role.scopeId);
		return !!orgId && allowed.includes(orgId);
	}
	return false;
};

export const normalizeOrgRoles = (roles: OrgRoleInput[]) =>
	roles.map((role) => ({
		roleId: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
		name: role.name,
		scopeType: role.scopeType,
		scopeId: role.scopeId,
	}));

export const orgRoleEquals = (a: OrgRoleInput, b: OrgRoleInput): boolean =>
	a.name === b.name &&
	(a.scopeType || null) === (b.scopeType || null) &&
	(a.scopeId || null) === (b.scopeId || null);

/** سازمانِ مؤثر برای فهرست کاربران (برای اکشن‌ساز سراسری اختیاری، برای سازمانی اجباری). */
export const resolveUsersOrgScope = async (
	user: ActorUser,
	organizationId?: string,
): Promise<string | undefined> => {
	const level = user.level as string;
	if (level === "Ghost" || level === "Manager" || level === "Editor") {
		return organizationId;
	}
	if (!["OrgHead", "UnitHead"].includes(level)) {
		return throwError("شما اجازه مشاهده کاربران را ندارید");
	}
	const allowed = await getAllowedManagerOrgIds(user);
	if (organizationId) {
		if (!allowed || !allowed.includes(organizationId)) {
			return throwError("شما به این سازمان دسترسی ندارید");
		}
		return organizationId;
	}
	if (allowed && allowed.length === 1) return allowed[0];
	if (allowed && allowed.length === 0) {
		return throwError("شما به سازمانی دسترسی ندارید");
	}
	return throwError("شناسه سازمان را مشخص کنید");
};

/** فیلتر مونگو برای کاربرانی که نقش سازمانی در orgId (سازمان یا واحدهایش) دارند. */
export const buildOrgUserRolesMatch = async (
	orgId: string | undefined,
): Promise<Record<string, unknown>> => {
	if (!orgId) return {};
	const unitRows = await unit
		.find({
			filters: { "organization._id": new ObjectId(orgId) },
			projection: { _id: 1 },
		})
		.toArray();
	const unitIds = unitRows.map((u) => u._id.toString());
	return {
		roles: {
			$elemMatch: {
				$or: [
					{ scopeType: "organization", scopeId: orgId },
					{ scopeType: "unit", scopeId: { $in: unitIds } },
				],
			},
		},
	};
};

/**
 * آیا کاربرِ هدف یک نقش سازمانی در یکی از سازمان‌های تحت‌مدیریت اکشن‌ساز دارد؟
 * (برای سراسری‌ها همیشه true — محدودیت فقط برای نقش‌های سازمانی است.)
 */
export const isUserInActorOrgs = async (
	actor: ActorUser,
	targetUserId: string,
): Promise<boolean> => {
	if (isGlobalManager(actor)) return true;
	const allowed = await getScopedOrgIds(actor);
	if (!allowed.length) return false;

	const target = await user.findOne({
		filters: { _id: new ObjectId(targetUserId) },
		projection: { roles: 1 },
	});
	if (!target) return false;
	const roles = (target as { roles?: Array<OrgRoleInput> }).roles || [];

	const allowedUnitIds = new Set<string>();
	if (roles.some((r) => r.scopeType === "unit")) {
		const unitRows = await unit
			.find({
				filters: {
					"organization._id": {
						$in: allowed.map((id) => new ObjectId(id)),
					},
				},
				projection: { _id: 1 },
			})
			.toArray();
		for (const u of unitRows) allowedUnitIds.add(u._id.toString());
	}

	return roles.some((role) => {
		if (role.scopeType === "organization") {
			return !!role.scopeId && allowed.includes(role.scopeId);
		}
		if (role.scopeType === "unit") {
			return !!role.scopeId && allowedUnitIds.has(role.scopeId);
		}
		return false;
	});
};

/** پیش‌اجرای دسترسی: کاربرِ هدف (body.details.set._id) باید در سازمان‌های اکشن‌ساز نقش داشته باشد. */
export const assertTargetUserInActorScope = () => {
	const check = async () => {
		const context = coreApp.contextFns.getContextModel() as unknown as {
			user: ActorUser;
			body?: { details?: { set?: { _id?: string } } };
		};
		const actor = context.user;
		if (isGlobalManager(actor)) return;
		const targetUserId = context.body?.details?.set?._id;
		if (!targetUserId) return throwError("شناسه کاربر الزامی است");
		const ok = await isUserInActorOrgs(actor, targetUserId);
		if (!ok) return throwError("شما به این کاربر دسترسی ندارید");
	};
	return check;
};

/** برای نقش‌های سازمانی (غیر سراسری): محدودیت سطح و عدم دست‌کاری تنظیمات جغرافیایی. */
export const checkOrgLeaderUserScopeUpdates = () => {
	const check = async () => {
		const context = coreApp.contextFns.getContextModel() as unknown as {
			user: ActorUser;
			body?: {
				details?: {
					set?: {
						level?: string;
						citySettingIds?: unknown;
						provinceSettingIds?: unknown;
						availableCharts?: unknown;
					};
				};
			};
		};
		const actor = context.user;
		if (isGlobalManager(actor)) return;
		const set = context.body?.details?.set;
		if (!set) return;
		if (
			set.level &&
			!["OrgHead", "UnitHead", "Patrol"].includes(set.level)
		) {
			return throwError(
				"سرپرست سازمان فقط می‌تواند سطح سرپرست/مامور تنظیم کند",
			);
		}
		if (
			set.citySettingIds || set.provinceSettingIds || set.availableCharts
		) {
			return throwError("محدوده جغرافیایی فقط توسط مدیر قابل تغییر است");
		}
	};
	return check;
};
