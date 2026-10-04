import { type ActFn, ObjectId } from "@deps";
import { coreApp, form_definition } from "../../../mod.ts";
import { assertOrgInActorScope, type MyContext, throwError } from "@lib";

export const removeFn: ActFn = async (body) => {
	const { set: { _id, hardCascade } } = body.details;
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
		return throwError("فرم فعال قابل حذف نیست؛ ابتدا آن را بایگانی کنید");
	}

	// `hardCascade` is honoured but never implied: a response stores its
	// definition id as a raw ObjectId precisely so that deleting a definition
	// cannot silently erase filed reports.
	return await form_definition.deleteOne({
		filter: { _id: new ObjectId(_id as string) },
		hardCascade: hardCascade || false,
	});
};
