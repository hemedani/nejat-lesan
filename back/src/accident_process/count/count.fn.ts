import { type ActFn, ObjectId } from "@deps";
import { accident_process } from "../../../mod.ts";

export const countFn: ActFn = async (body) => {
	const {
		set: { organizationId, status, incident_type },
	} = body.details;

	const filters: Record<string, any> = {};
	if (organizationId) {
		filters["organization._id"] = new ObjectId(organizationId as string);
	}
	if (status) filters.status = status;
	if (incident_type) filters.incident_type = incident_type;

	return { qty: await accident_process.countDocument({ filter: filters }) };
};
