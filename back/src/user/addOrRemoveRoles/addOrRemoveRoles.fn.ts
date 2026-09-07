import { type ActFn, ObjectId } from "@deps";
import { coreApp, user } from "../../../mod.ts";
import { type MyContext, throwError } from "@lib";
import {
	assertRolesAssignable,
	isRoleWithinActorScope,
	normalizeOrgRoles,
	orgRoleEquals,
	type OrgRoleInput,
} from "@lib";

export const addOrRemoveRolesFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { _id, addRoles = [], removeRoles = [] } = set;

	const context = coreApp.contextFns.getContextModel() as MyContext;
	const actor = context.user;

	const target = await user.findOne({
		filters: { _id: new ObjectId(_id as string) },
		projection: { roles: 1 },
	});
	if (!target) return throwError("کاربر یافت نشد");

	if (!addRoles?.length && !removeRoles?.length) {
		return await user.findOne({
			filters: { _id: new ObjectId(_id as string) },
			projection: get as any,
		});
	}

	const existing = ((target as any).roles || []) as Array<
		OrgRoleInput & { roleId: string }
	>;

	// افزودن
	const toAdd = (addRoles || []) as OrgRoleInput[];
	if (toAdd.length) {
		await assertRolesAssignable(actor, toAdd);
		for (const role of toAdd) {
			if (existing.some((r) => orgRoleEquals(r, role))) {
				return throwError("این نقش قبلاً برای کاربر ثبت شده است");
			}
		}
	}

	// حذف
	const toRemove = (removeRoles || []) as OrgRoleInput[];
	for (const role of toRemove) {
		const match = existing.find((r) => orgRoleEquals(r, role));
		if (!match) {
			return throwError("نقش موردنظر روی این کاربر یافت نشد");
		}
		const allowed = await isRoleWithinActorScope(actor, role);
		if (!allowed) {
			return throwError("شما اجازه حذف این نقش را ندارید");
		}
	}

	const remaining = existing.filter(
		(r) => !toRemove.some((role) => orgRoleEquals(r, role)),
	);
	const nextRoles = [...remaining, ...normalizeOrgRoles(toAdd)];

	return await user.findOneAndUpdate({
		filter: { _id: new ObjectId(_id as string) },
		update: {
			$set: { roles: nextRoles, updatedAt: new Date() },
		},
		projection: get as any,
	});
};
