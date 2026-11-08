import { type ActFn, ObjectId } from "@deps";
import { accident } from "../../../mod.ts";
import {
	planAttachmentCleanup,
	releaseReportAttachments,
} from "../../shared/reportAttachments.ts";

export const removeFn: ActFn = async (body) => {
	const {
		set: { _id, hardCascade },
		get,
	} = body.details;

	const id = new ObjectId(_id as string);

	// Read both sides of the attachments before anything goes: the cascade
	// removes the `file` rows that carry a back-reference, and the report's own
	// `attachments` array is only readable while the report exists.
	const plan = await planAttachmentCleanup("accident", id);

	const removed = await accident.deleteOne({
		filter: { _id: id },
		hardCascade: hardCascade || false,
	});

	// Only after the rows are gone. A refused delete — `hardCascade: false` on a
	// report that has attachments throws — must not take the evidence with it.
	if (removed) await releaseReportAttachments(plan);

	return removed;
};
