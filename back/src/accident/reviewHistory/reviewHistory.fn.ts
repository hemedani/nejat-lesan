import { type ActFn, ObjectId } from "@deps";
import { accident, accident_review, coreApp } from "../../../mod.ts";
import { throwError, type MyContext } from "@lib";
import { getReportScope } from "../reportScope.ts";

export const reviewHistoryFn: ActFn = async (body) => {
	const context = coreApp.contextFns.getContextModel() as MyContext;
	const { reportId, page = 1, limit = 50 } = body.details.set;
	const report = await accident.findOne({
		filters: {
			_id: new ObjectId(reportId as string),
			...getReportScope(context.user),
		},
		projection: { _id: 1 },
	});
	if (!report) return throwError("گزارش یافت نشد یا دسترسی ندارید");
	return await accident_review.find({
		filters: { "accident._id": new ObjectId(reportId as string) },
		projection: body.details.get,
	}).sort({ action_at: -1, _id: -1 }).skip((page - 1) * limit).limit(Math.min(limit, 100)).toArray();
};
