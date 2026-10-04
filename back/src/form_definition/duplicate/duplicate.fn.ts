import { type ActFn, ObjectId } from "@deps";
import { coreApp, form_definition } from "../../../mod.ts";
import { assertOrgInActorScope, type MyContext, throwError } from "@lib";

export const duplicateFn: ActFn = async (body) => {
	const { set: { _id }, get } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const source = await form_definition.findOne({
		filters: { _id: new ObjectId(_id as string) },
		projection: {
			_id: 1,
			name: 1,
			description: 1,
			form_kind: 1,
			icon: 1,
			definition: 1,
			"organization._id": 1,
		},
	});
	if (!source) return throwError("فرم یافت نشد");

	const src = source as unknown as {
		name: string;
		description?: string;
		form_kind?: string;
		icon?: string;
		definition?: unknown;
		organization?: { _id?: ObjectId };
	};
	const orgId = src.organization?._id;
	if (!orgId) return throwError("فرم سازمان معتبری ندارد");
	await assertOrgInActorScope(user, orgId.toString());

	return await form_definition.insertOne({
		doc: {
			name: `${src.name} (کپی)`,
			...(src.description && { description: src.description }),
			// A copy inherits the kind and icon so the author edits a form of the same
			// shape, but it starts as a draft and never inherits activation.
			form_kind: (src.form_kind ?? "accident") as never,
			...(src.icon && { icon: src.icon }),
			status: "draft",
			version: 1,
			// Deep clone so editing the copy cannot mutate the original.
			definition: JSON.parse(
				JSON.stringify(src.definition ?? { pages: [] }),
			),
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			organization: {
				_ids: orgId,
				relatedRelations: { form_definitions: true },
			},
			registrer: { _ids: user._id },
		},
		projection: get,
	});
};
