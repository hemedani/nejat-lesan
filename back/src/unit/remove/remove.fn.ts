import { type ActFn, ObjectId } from "@deps";
import { coreApp, unit } from "../../../mod.ts";
import { assertOrgInActorScope, type MyContext, throwError } from "@lib";

export const removeFn: ActFn = async (body) => {
	const {
		set: { _id, hardCascade },
	} = body.details;

	const context = coreApp.contextFns.getContextModel() as MyContext;
	const target = await unit.findOne({
		filters: { _id: new ObjectId(_id as string) },
		projection: { _id: 1, "organization._id": 1 },
	});
	if (!target) return throwError("واحد یافت نشد");
	const orgId = (target as any).organization?._id as ObjectId | undefined;
	if (orgId) await assertOrgInActorScope(context.user, orgId.toString());

	return await unit.deleteOne({
		filter: { _id: new ObjectId(_id as string) },
		hardCascade: hardCascade || false,
	});
};
