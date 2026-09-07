import { type ActFn, ObjectId } from "@deps";
import { accident_process, coreApp, organization } from "../../../mod.ts";
import { assertOrgInActorScope, type MyContext } from "@lib";
import { throwError } from "@lib";

export const addFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const { organizationId, name, description, incident_type, steps } = set;

	await assertOrgInActorScope(user, organizationId as string);

	const org = await organization.findOne({
		filters: { _id: new ObjectId(organizationId as string) },
		projection: { _id: 1 },
	});
	if (!org) return throwError("سازمان مورد نظر یافت نشد");

	return await accident_process.insertOne({
		doc: {
			name,
			...(description && { description }),
			...(incident_type && { incident_type }),
			status: "draft",
			version: 1,
			is_active: false,
			steps: steps || [],
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			organization: {
				_ids: new ObjectId(organizationId as string),
				relatedRelations: { accident_processes: true },
			},
			registrer: {
				_ids: user._id,
			},
		},
		projection: get,
	});
};
