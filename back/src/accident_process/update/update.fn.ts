import { type ActFn, ObjectId } from "@deps";
import { accident_process, coreApp } from "../../../mod.ts";
import { assertOrgInActorScope, type MyContext } from "@lib";
import { throwError } from "@lib";

export const updateFn: ActFn = async (body) => {
	const {
		set: { _id, ...rest },
		get,
	} = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const process = await accident_process.findOne({
		filters: { _id: new ObjectId(_id as string) },
		projection: { _id: 1, status: 1, "organization._id": 1 },
	});
	if (!process) return throwError("فرآیند یافت نشد");
	const pOrgId = (process as any).organization?._id as ObjectId | undefined;
	if (!pOrgId) return throwError("فرآیند سازمان معتبری ندارد");
	await assertOrgInActorScope(user, pOrgId.toString());
	if ((process as any).status === "active") {
		return throwError(
			"فرآیند فعال قابل ویرایش نیست؛ ابتدا آن را غیرفعال کنید",
		);
	}

	const updateObj: Record<string, any> = { updatedAt: new Date() };
	for (const [key, value] of Object.entries(rest)) {
		if (value !== undefined) updateObj[key] = value;
	}

	return await accident_process.findOneAndUpdate({
		filter: { _id: new ObjectId(_id as string) },
		update: { $set: updateObj },
		projection: get,
	});
};
