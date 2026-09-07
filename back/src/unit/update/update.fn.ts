import { type ActFn, ObjectId } from "@deps";
import { coreApp, unit } from "../../../mod.ts";
import { assertOrgInActorScope, type MyContext, throwError } from "@lib";

export const updateFn: ActFn = async (body) => {
	const {
		set: { _id, ...rest },
		get,
	} = body.details;

	const context = coreApp.contextFns.getContextModel() as MyContext;
	const target = await unit.findOne({
		filters: { _id: new ObjectId(_id as string) },
		projection: { _id: 1, "organization._id": 1 },
	});
	if (!target) return throwError("واحد یافت نشد");
	const orgId = (target as any).organization?._id as ObjectId | undefined;
	if (!orgId) return throwError("واحد سازمان معتبری ندارد");
	await assertOrgInActorScope(context.user, orgId.toString());

	const updateObj: Record<string, any> = { updatedAt: new Date() };

	for (const [key, value] of Object.entries(rest)) {
		if (value !== undefined) updateObj[key] = value;
	}

	return await unit.findOneAndUpdate({
		filter: { _id: new ObjectId(_id as string) },
		update: { $set: updateObj },
		projection: get,
	});
};
