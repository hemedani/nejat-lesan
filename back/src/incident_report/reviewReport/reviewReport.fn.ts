import { type ActFn } from "@deps";
import { coreApp, incident_report } from "../../../mod.ts";
import { type MyContext, throwError } from "@lib";
import {
	applyReviewTransition,
	assertReviewBatchAllowed,
	reviewScopeFor,
} from "../oversight/reviewTransition.ts";

/**
 * Managerial review for a single non-accident report.
 *
 * The state machine is identical to `accident.reviewReport` — it keys on
 * `sync_status`, `review_status` and `review_history`, which are the same on both
 * models — so both live in `oversight/reviewTransition.ts` and this act is only the
 * one-report surface of it. `model` is pinned here so this act keeps its own
 * collection boundary; the batch act resolves the model per id.
 */
export const reviewReportFn: ActFn = async (body) => {
	const { reportId, action, reason } = body.details.set;
	const { get } = body.details;
	const { user } = coreApp.contextFns.getContextModel() as MyContext;

	// Before the scope is resolved, so a caller without permission gets the role
	// guard rather than whatever the scope lookup says about their level.
	assertReviewBatchAllowed({
		actor: user,
		action: action as string,
		reason: reason as string | undefined,
	});

	const outcome = await applyReviewTransition({
		model: incident_report,
		reportId: reportId as string,
		action: action as string,
		reason: reason as string | undefined,
		actor: user,
		scope: await reviewScopeFor(user),
		projection: get,
	});

	if (!outcome.ok) return throwError(outcome.error);
	return outcome.doc;
};
