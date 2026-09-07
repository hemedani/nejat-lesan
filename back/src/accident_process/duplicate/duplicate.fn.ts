import { type ActFn, ObjectId } from "@deps";
import { accident_process, coreApp } from "../../../mod.ts";
import { assertOrgInActorScope, type MyContext } from "@lib";
import { throwError } from "@lib";

export const duplicateFn: ActFn = async (body) => {
	const {
		set: { _id },
		get,
	} = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const source = await accident_process.findOne({
		filters: { _id: new ObjectId(_id as string) },
		projection: {
			_id: 1,
			name: 1,
			description: 1,
			incident_type: 1,
			steps: 1,
			"organization._id": 1,
		},
	});
	if (!source) return throwError("فرآیند یافت نشد");
	const orgId = (source as any).organization?._id as ObjectId | undefined;
	if (!orgId) return throwError("فرآیند سازمان معتبری ندارد");
	await assertOrgInActorScope(user, orgId.toString());

	const clone = await accident_process.insertOne({
		doc: {
			name: `${(source as any).name} (Copy)`,
			...(source as any).description && {
				description: (source as any).description,
			},
			...(source as any).incident_type && {
				incident_type: (source as any).incident_type,
			},
			status: "draft",
			version: 1,
			is_active: false,
			steps: JSON.parse(JSON.stringify((source as any).steps || [])),
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			organization: {
				_ids: orgId,
				relatedRelations: { accident_processes: true },
			},
			registrer: {
				_ids: user._id,
			},
		},
		projection: get,
	});

	return clone;
};
