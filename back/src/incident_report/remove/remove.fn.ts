import { type ActFn, ObjectId } from "@deps";
import { coreApp, incident_report } from "../../../mod.ts";
import { getOrgReportBase } from "../../accident/reportScope.ts";
import { type MyContext, throwError } from "@lib";

/**
 * Delete a report.
 *
 * Only an organization leader can delete, and only inside their own road scope. A
 * synced report still cannot be deleted by a patrol officer — they correct it via
 * `update`, which keeps the review history intact.
 */
export const removeFn: ActFn = async (body) => {
	const { set } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const scope = await getOrgReportBase(user);
	const removed = await incident_report.deleteOne({
		filter: { _id: new ObjectId(set._id as string), ...scope },
		hardCascade: (set.hardCascade as boolean) || false,
	});
	// Lesan's deleteOne resolves to a boolean; a false means the filter matched
	// nothing, which is also what a report outside the caller's scope looks like.
	if (!removed) {
		return throwError("گزارش یافت نشد یا دسترسی ندارید");
	}
	return { success: true };
};
