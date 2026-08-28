import { type ActFn, ObjectId } from "@deps";
import { accident, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "@lib";

export const getSyncStatusFn: ActFn = async (body) => {
	const {
		set: { userId },
		get,
	} = body.details;
	const context: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;
	const actor = context.user;

	let targetId: string;

	if (userId) {
		if (actor.level !== "Manager" && actor.level !== "Ghost") {
			return throwError("شما اجازه این کار را ندارید");
		}
		targetId = userId as string;
	} else {
		if (
			actor.level !== "Manager" &&
			actor.level !== "Ghost" &&
			actor.level !== "Patrol"
		) {
			return throwError("شما اجازه این کار را ندارید");
		}
		targetId = actor._id.toString();
	}

	const syncStatuses = [
		"draft",
		"queued",
		"syncing",
		"synced",
		"rejected",
	] as const;

	const result: Record<string, any[]> = {};

	for (const status of syncStatuses) {
		const accidents = await accident
			.find({
				filters: {
					"officer._id": new ObjectId(targetId),
					sync_status: status,
				},
				projection: get,
			})
			.toArray();
		result[status] = accidents;
	}

	return result;
};
