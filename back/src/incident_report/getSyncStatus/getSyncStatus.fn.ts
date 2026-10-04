import { type ActFn, ObjectId } from "@deps";
import { coreApp, incident_report } from "../../../mod.ts";
import { type MyContext, throwError } from "@lib";

/**
 * Sync-state buckets for non-accident reports.
 *
 * The app asks `accident.getSyncStatus` for accidents; without this sibling the
 * patrol dashboard's sync widget would silently stop counting every report that is
 * not an accident.
 */
export const getSyncStatusFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	let targetId: string;
	if (set.userId) {
		if (user.level !== "Manager" && user.level !== "Ghost") {
			return throwError("شما اجازه این کار را ندارید");
		}
		targetId = set.userId as string;
	} else {
		if (
			user.level !== "Manager" &&
			user.level !== "Ghost" &&
			user.level !== "Patrol"
		) {
			return throwError("شما اجازه این کار را ندارید");
		}
		targetId = user._id.toString();
	}

	const syncStatuses = [
		"draft",
		"queued",
		"syncing",
		"synced",
		"rejected",
	] as const;

	const result: Record<string, unknown[]> = {};
	for (const status of syncStatuses) {
		result[status] = await incident_report
			.find({
				filters: {
					"officer._id": new ObjectId(targetId),
					sync_status: status,
				},
				projection: get,
			})
			.toArray();
	}

	return result;
};
