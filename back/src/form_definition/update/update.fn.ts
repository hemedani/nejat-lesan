import { type ActFn, ObjectId } from "@deps";
import { coreApp, form_definition } from "../../../mod.ts";
import { assertOrgInActorScope, type MyContext, throwError } from "@lib";

export const updateFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { _id, ...rest } = set;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const definition = await form_definition.findOne({
		filters: { _id: new ObjectId(_id as string) },
		projection: { _id: 1, status: 1, "organization._id": 1 },
	});
	if (!definition) return throwError("فرم یافت نشد");

	const orgId =
		(definition as unknown as { organization?: { _id?: ObjectId } })
			.organization?._id;
	if (!orgId) return throwError("فرم سازمان معتبری ندارد");
	await assertOrgInActorScope(user, orgId.toString());

	if ((definition as unknown as { status: string }).status === "active") {
		return throwError(
			"فرم فعال قابل ویرایش نیست؛ ابتدا آن را غیرفعال کنید",
		);
	}

	// Only defined keys are written, so a partial update never nulls a column.
	const updateObj: Record<string, unknown> = { updatedAt: new Date() };
	for (const [key, value] of Object.entries(rest)) {
		if (value !== undefined) updateObj[key] = value;
	}

	return await form_definition.findOneAndUpdate({
		filter: { _id: new ObjectId(_id as string) },
		update: { $set: updateObj },
		projection: get,
	});
};
