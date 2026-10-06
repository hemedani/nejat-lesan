import { type ActFn, ObjectId } from "@deps";
import { coreApp, incident_report } from "../../../mod.ts";
import { type MyContext, throwError } from "@lib";
import {
	getOrgReportBase,
	getOrgScopedRoadIds,
	isOrgLeaderLevel,
} from "../../accident/reportScope.ts";

/**
 * The embedded review trail for one non-accident report, newest action first.
 *
 * Mirrors `accident.reviewHistory`; the audit rows are the same shape on both
 * models, so a review screen reads either one the same way.
 */

export const reviewHistoryFn: ActFn = async (body) => {
	const context = coreApp.contextFns.getContextModel() as MyContext;
	const { reportId, page = 1, limit = 50 } = body.details.set;

	// A zero-road organization is the one scope failure `getOrgReportBase` reports by
	// throwing rather than by matching nothing, and this is a sub-resource of a report
	// the caller can already see — so the truthful answer is an empty trail, not a
	// refusal. Checked explicitly rather than by catching the throw, so that a genuine
	// failure still surfaces instead of reading as "never reviewed".
	if (isOrgLeaderLevel(context.user.level)) {
		const roads = await getOrgScopedRoadIds(context.user);
		if (!roads?.length) return [];
	}

	const report = await incident_report.findOne({
		filters: {
			_id: new ObjectId(reportId as string),
			...(await getOrgReportBase(context.user)),
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
