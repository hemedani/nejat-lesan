import { type ActFn, ObjectId } from "@deps";
import { accident, coreApp } from "../../../mod.ts";
import { type MyContext, throwError } from "@lib";
import {
	getOrgReportBase,
	getOrgScopedRoadIds,
	isOrgLeaderLevel,
} from "../reportScope.ts";

/**
 * The embedded review trail for one accident, newest action first.
 *
 * Scoped rather than open, because a report describes where an incident happened
 * and who filed it — the same tenancy rule `accident.get` follows.
 */
export const reviewHistoryFn: ActFn = async (body) => {
	const context = coreApp.contextFns.getContextModel() as MyContext;
	const { reportId, page = 1, limit = 50 } = body.details.set;

	// A zero-road organization is the one scope failure `getOrgReportBase` reports by
	// throwing rather than by matching nothing. The trail is a sub-resource of a report
	// the caller can already see, and an organization with no roads has no reports, so
	// the truthful answer is an empty trail — not a red error box on a page reached by
	// legitimate navigation.
	//
	// Checked explicitly instead of catching the throw: a catch-all here would also
	// swallow a genuine failure and answer `[]` for it, which is indistinguishable from
	// "this report was never reviewed". Every other error still propagates.
	if (isOrgLeaderLevel(context.user.level)) {
		const roads = await getOrgScopedRoadIds(context.user);
		if (!roads?.length) return [];
	}

	const report = await accident.findOne({
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
