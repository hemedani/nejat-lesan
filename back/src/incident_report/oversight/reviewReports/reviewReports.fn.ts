import { type ActFn } from "@deps";
import { coreApp } from "../../../../mod.ts";
import { type MyContext } from "@lib";
import {
	applyReviewTransition,
	assertReviewBatchAllowed,
	reviewScopeFor,
} from "../reviewTransition.ts";

/**
 * Apply one review action to many reports.
 *
 * Deliberately not all-or-nothing. A mixed batch is the normal case — some rows are
 * not synced, some are in the wrong state, some belong to another organization —
 * and a reviewer needs the full picture, so each row reports its own outcome and the
 * loop never short-circuits.
 *
 * Only the guards that belong to the whole request (the caller's role, a reason for
 * a return) throw; they are settled once, before any row is touched.
 */
export const reviewReportsFn: ActFn = async (body) => {
	const { reportIds, action, reason } = body.details.set as {
		reportIds: string[];
		action: string;
		reason?: string;
	};
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	assertReviewBatchAllowed({
		actor: user,
		action,
		reason,
	});

	// Resolved once: it is the same for every row, and re-resolving per row would
	// re-query the caller's organization for each of forty reports.
	const scope = await reviewScopeFor(user);

	const results: Array<{
		reportId: string;
		ok: boolean;
		error?: string;
		review_status?: string;
	}> = [];

	for (const reportId of reportIds) {
		const outcome = await applyReviewTransition({
			reportId,
			action,
			reason,
			actor: user,
			scope,
		});
		results.push(
			outcome.ok
				? { reportId, ok: true, review_status: outcome.review_status }
				: { reportId, ok: false, error: outcome.error },
		);
	}

	return { results };
};
