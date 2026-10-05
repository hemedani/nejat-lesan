import { type ActFn } from "@deps";
import { accident, coreApp } from "../../../mod.ts";
import { type MyContext, throwError } from "@lib";
import {
	applyReviewTransition,
	assertReviewBatchAllowed,
	reviewScopeFor,
	type ReviewModel,
} from "../../incident_report/oversight/reviewTransition.ts";

/**
 * Managerial review for a single accident.
 *
 * The state machine itself lives in `incident_report/oversight/reviewTransition.ts`
 * and is shared with the report acts, because it keys on `sync_status`,
 * `review_status` and `review_history` — the same three columns on both models. It
 * used to be a second copy here, and the copy drifted: it kept refusing a `queued`
 * report after the shared machine learned to acknowledge one, so the same click gave
 * two different answers depending on which model the row happened to be. `model` is
 * pinned so this act keeps its own collection boundary, and it throws (rather than
 * returning per-row outcomes) because there is only one row to answer about.
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
		model: accident as unknown as ReviewModel,
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
