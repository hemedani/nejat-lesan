import { type ActFn, ObjectId } from "@deps";
import { coreApp, shift } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "@lib";

export const getActiveShiftFn: ActFn = async (body) => {
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
			actor.level !== "Manager" && actor.level !== "Ghost" &&
			actor.level !== "Patrol"
		) {
			return throwError("شما اجازه این کار را ندارید");
		}
		targetId = actor._id.toString();
	}

	const activeShift = await shift.findOne({
		filters: {
			"officer._id": new ObjectId(targetId),
			status: "active",
		},
		projection: get,
	});

	if (!activeShift) {
		return throwError("شیفت فعالی یافت نشد");
	}

	return activeShift;
};