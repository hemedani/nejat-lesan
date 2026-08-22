import { type ActFn, ObjectId } from "@deps";
import { coreApp, shift } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "@lib";

export const endShiftFn: ActFn = async (body) => {
	const {
		set: { shiftId },
		get,
	} = body.details;
	const context: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;
	const actor = context.user;

	const founded = await shift.findOne({
		filters: { _id: new ObjectId(shiftId as string) },
		projection: { _id: 1, status: 1, "officer._id": 1 },
	});

	if (!founded) {
		return throwError("شیفت یافت نشد");
	}

	if (founded.status !== "active") {
		return throwError("شیفت فعال نیست");
	}

	const isManager = actor.level === "Manager" || actor.level === "Ghost";
	const isOwner =
		founded.officer?._id?.toString() === actor._id.toString();

	if (!isManager && !isOwner) {
		return throwError("شما اجازه این کار را ندارید");
	}

	return await shift.findOneAndUpdate({
		filter: { _id: new ObjectId(shiftId as string) },
		update: {
			$set: {
				status: "ended",
				end_at: new Date(),
				updatedAt: new Date(),
			},
		},
		projection: get,
	});
};