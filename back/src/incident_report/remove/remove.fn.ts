import { type ActFn, ObjectId } from "@deps";
import { coreApp, incident_report } from "../../../mod.ts";
import { getOrgReportBase } from "../../accident/reportScope.ts";
import {
	planAttachmentCleanup,
	releaseReportAttachments,
} from "../../shared/reportAttachments.ts";
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

	const id = new ObjectId(set._id as string);
	const scope = await getOrgReportBase(user);

	// Read both sides of the attachments before anything goes: the cascade
	// removes the `file` rows that carry a back-reference, and the report's own
	// `attachments` array is only readable while the report exists. Not filtered
	// by `scope` — nothing is released unless the delete below succeeds, and a
	// report outside the caller's scope fails there.
	const plan = await planAttachmentCleanup("incident_report", id);

	const removed = await incident_report.deleteOne({
		filter: { _id: id, ...scope },
		hardCascade: (set.hardCascade as boolean) || false,
	});
	// Lesan's deleteOne resolves to a boolean; a false means the filter matched
	// nothing, which is also what a report outside the caller's scope looks like.
	if (!removed) {
		return throwError("گزارش یافت نشد یا دسترسی ندارید");
	}

	// The rows are gone; the bytes and the rows the cascade could not reach are
	// ours to finish. Skipped on every path that leaves the report in place.
	await releaseReportAttachments(plan);

	return { success: true };
};
