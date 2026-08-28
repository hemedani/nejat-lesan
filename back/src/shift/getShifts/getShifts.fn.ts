import type { ActFn, Document } from "@deps";
import { ObjectId } from "@deps";
import { shift } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { coreApp, patrol_unit } from "../../../mod.ts";
import { throwError } from "@lib";

export const getShiftsFn: ActFn = async (body) => {
	const {
		set: { userId, patrolUnitId, page, limit, status },
		get,
	} = body.details;
	const context: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;
	const actor = context.user;

	const isManager = actor.level === "Manager" || actor.level === "Ghost";

	const match: Document = {};

	if (!isManager) {
		if (actor.level !== "Patrol") {
			return throwError("شما اجازه این کار را ندارید");
		}
		match["officer._id"] = new ObjectId(actor._id.toString());
	} else if (userId) {
		match["officer._id"] = new ObjectId(userId as string);
	}

	if (patrolUnitId) {
		if (!isManager) {
			return throwError("شما اجازه این کار را ندارید");
		}
		const foundedUnit = await patrol_unit.findOne({
			filters: { _id: new ObjectId(patrolUnitId as string) },
			projection: { _id: 1 },
		});
		if (!foundedUnit) return throwError("گشت یافت نشد");
		match["patrol_unit._id"] = new ObjectId(patrolUnitId as string);
	}

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
