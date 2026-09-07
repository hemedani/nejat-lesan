import { type ActFn, ObjectId } from "@deps";
import { accident_process, coreApp } from "../../../mod.ts";
import { assertOrgInActorScope, type MyContext } from "@lib";
import { throwError } from "@lib";

export const removeFn: ActFn = async (body) => {
	const {
		set: { _id, hardCascade },
	} = body.details;

	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const process = await accident_process.findOne({
		filters: { _id: new ObjectId(_id as string) },
		projection: { _id: 1, status: 1, "organization._id": 1 },
	});
	if (!process) return throwError("فرآیند یافت نشد");
	const rOrgId = (process as any).organization?._id as ObjectId | undefined;
	if (!rOrgId) return throwError("فرآیند سازمان معتبری ندارد");
	await assertOrgInActorScope(user, rOrgId.toString());
	if ((process as any).status === "active") {
		return throwError(
			"فرآیند فعال قابل حذف نیست؛ ابتدا آن را بایگانی کنید",
		);
	}

	return await accident_process.deleteOne({
		filter: { _id: new ObjectId(_id as string) },
		hardCascade: hardCascade || false,
	});
};
