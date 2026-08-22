import type { ActFn, Document } from "@deps";
import { ObjectId } from "@deps";
import { coreApp, shift } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "@lib";

export const getShiftsFn: ActFn = async (body) => {
	const {
		set: { userId, page, limit, status },
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

	const match: Document = {
		"officer._id": new ObjectId(targetId),
	};

	status && (match["status"] = status);

	const pipeline: Document[] = [
		{ $match: match },
		{ $sort: { _id: -1 } },
		{ $skip: (page - 1) * limit },
		{ $limit: limit },
	];

	return await shift
		.aggregation({
			pipeline,
			projection: get,
		})
		.toArray();
};