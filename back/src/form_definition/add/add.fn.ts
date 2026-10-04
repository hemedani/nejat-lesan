import { type ActFn, ObjectId } from "@deps";
import { coreApp, form_definition, organization } from "../../../mod.ts";
import { assertOrgInActorScope, type MyContext, throwError } from "@lib";

export const addFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const { organizationId, name, description, form_kind, icon, definition } =
		set;

	await assertOrgInActorScope(user, organizationId as string);

	const org = await organization.findOne({
		filters: { _id: new ObjectId(organizationId as string) },
		projection: { _id: 1 },
	});
	if (!org) return throwError("سازمان مورد نظر یافت نشد");

	return await form_definition.insertOne({
		doc: {
			name,
			...(description && { description }),
			form_kind: form_kind ?? "accident",
			...(icon && { icon }),
			status: "draft",
			version: 1,
			definition: definition ?? { pages: [] },
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			organization: {
				_ids: new ObjectId(organizationId as string),
				relatedRelations: { form_definitions: true },
			},
			registrer: { _ids: user._id },
		},
		projection: get,
	});
};
