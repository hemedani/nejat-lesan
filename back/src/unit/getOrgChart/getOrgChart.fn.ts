import { type ActFn, ObjectId } from "@deps";
import { coreApp, organization, unit } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "@lib";

/**
 * نمودار سازمانی در یک فراخوانی (port از Satek `unit.getOrgChart`).
 * - Ghost/Manager: باید orgId بدهند.
 * - OrgHead (scopeType: organization): org از scopeId نقش حل می‌شود.
 * - UnitHead (scopeType: unit): org از طریق unit.organization پیدا می‌شود.
 * خروجی فلت با `parentUnit: { _id, name }` است تا کلاینت درخت بسازد.
 */
export const getOrgChartFn: ActFn = async (body) => {
	const {
		set: { orgId: paramOrgId, activeRoleId },
		get,
	} = body.details;

	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	let effectiveOrgId: ObjectId;

	const isGlobal =
		user.level === "Ghost" || user.level === "Manager";

	if (isGlobal && !activeRoleId) {
		if (!paramOrgId) {
			return throwError("برای مدیر، شناسه سازمان (orgId) الزامی است");
		}
		effectiveOrgId = new ObjectId(paramOrgId as string);
	} else {
		const roles = (user.roles || []) as Array<{
			roleId: string;
			name?: string;
			scopeType?: string;
			scopeId?: string;
		}>;
		const activeRole = activeRoleId
			? roles.find((r) => r.roleId === activeRoleId)
			: roles.find((r) => r.scopeType && r.scopeId);

		if (!activeRole?.scopeId) {
			return throwError("نقش سازمانی معتبری یافت نشد");
		}

		if (activeRole.scopeType === "organization") {
			effectiveOrgId = new ObjectId(activeRole.scopeId);
		} else if (activeRole.scopeType === "unit") {
			const u = await unit.findOne({
				filters: { _id: new ObjectId(activeRole.scopeId) },
				projection: { _id: 1, "organization._id": 1 },
			});
			const uOrgId = (u as any)?.organization?._id as
				| ObjectId
				| undefined;
			if (!uOrgId) {
				return throwError("سازمان واحد یافت نشد");
			}
			effectiveOrgId = uOrgId;
		} else {
			return throwError("نقش باید scope سازمانی یا واحدی داشته باشد");
		}
	}

	const result: Record<string, unknown> = {};
	const tasks: Promise<void>[] = [];

	if (get.units === 1) {
		tasks.push(
			unit
				.find({
					filters: { "organization._id": effectiveOrgId },
					projection: {
						_id: 1,
						code: 1,
						name: 1,
						type: 1,
						is_active: 1,
						head_title: 1,
						head: { _id: 1, first_name: 1, last_name: 1 },
						parentUnit: { _id: 1, name: 1 },
					},
				})
				.sort({ _id: 1 })
				.toArray()
				.then((arr) => {
					result.units = arr;
					result.totalCount = arr.length;
				}),
		);
	}

	if (get.organization === 1) {
		tasks.push(
			organization
				.find({
					filters: { _id: effectiveOrgId },
					projection: {
						_id: 1,
						code: 1,
						name: 1,
						enName: 1,
						description: 1,
						is_active: 1,
						head: { _id: 1, first_name: 1, last_name: 1 },
						logo: { _id: 1, name: 1 },
					},
				})
				.toArray()
				.then((arr) => {
					result.organization = arr[0] || null;
				}),
		);
	}

	if (get.stats === 1) {
		tasks.push(
			unit
				.aggregation({
					pipeline: [
						{ $match: { "organization._id": effectiveOrgId } },
						{ $group: { _id: "$type", count: { $sum: 1 } } },
					],
				})
				.toArray()
				.then((arr) => {
					result.stats = arr;
				}),
		);
	}

	await Promise.all(tasks);
	return result;
};
