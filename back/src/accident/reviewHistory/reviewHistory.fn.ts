import { type ActFn, ObjectId } from "@deps";
import { accident, coreApp } from "../../../mod.ts";
import { type MyContext, throwError } from "@lib";
import { getReportScope } from "../reportScope.ts";

export const reviewHistoryFn: ActFn = async (body) => {
	const context = coreApp.contextFns.getContextModel() as MyContext;
	const { reportId, page = 1, limit = 50 } = body.details.set;

	const report = await accident.findOne({
		filters: {
			_id: new ObjectId(reportId as string),
			...getReportScope(context.user),
		},
		projection: { review_history: 1 },
	});
	if (!report) return throwError("گزارش یافت نشد یا دسترسی ندارید");

	const history: any[] = report.review_history || [];
	const sorted = [...history].sort(
		(a, b) =>
			new Date(b.action_at).getTime() - new Date(a.action_at).getTime(),
	);

	const finalLimit = Math.min(limit as number, 100);
	const start = ((page as number) - 1) * (finalLimit || 50);
	return sorted.slice(start, start + finalLimit);
};
