import { type Document, ObjectId } from "@deps";
import { accident, incident_report } from "../../../mod.ts";
import { type MyContext, throwError } from "@lib";
import {
	getOrgReportBase,
	isManagerViewer,
	isOrgLeaderLevel,
} from "../../accident/reportScope.ts";

/**
 * The one review state machine, shared by `incident_report.reviewReport` (one
 * report) and `incident_report.reviewReports` (a batch).
 *
 * Extracted rather than duplicated so the two surfaces cannot drift: a reviewer
 * acting on one row must not get a different answer from the same action applied
 * to forty. Every guard, table and history field below is copied verbatim from the
 * act that used to own them.
 */

type ActorUser = MyContext["user"];

/** Either report model. Both carry the same `sync_status`/`review_status` shape. */
export type ReviewModel = Pick<
	typeof incident_report,
	"findOne" | "findOneAndUpdate"
>;

/** What the transition reads off a report before it decides anything. */
type StoredReviewRow = {
	_id: ObjectId;
	review_status?: string;
	sync_status?: string;
	synced_at?: Date;
};

const transitions: Record<string, string[]> = {
	submitted: ["start_review"],
	under_review: ["return", "approve"],
	approved: ["complete"],
};

const actionStatus: Record<string, string> = {
	start_review: "under_review",
	return: "returned",
	approve: "approved",
	complete: "completed",
};

/**
 * The sync states a report may be reviewed in.
 *
 * A report can only reach the server by arriving, so `synced` and `queued` both
 * mean the console is holding it. `queued` is a row filed before the arrival
 * instant was recorded — an older build of the app, or a row the control centre
 * typed in itself — and it is reviewable because the alternative is a report that
 * no one can ever review: a Patrol may only write `draft|queued`, and no console
 * action writes `synced`. Starting its review *is* the acknowledgement, so the
 * transition promotes it (see the update below) instead of refusing it.
 *
 * `draft`, `syncing` and `rejected` are refused: a draft has not been filed, a
 * `syncing` row is mid-retry and will settle, and a `rejected` row is waiting on
 * the reporter's correction rather than on the reviewer.
 */
const REVIEWABLE_SYNC = ["synced", "queued"];

export type ReviewOutcome =
	| { ok: true; review_status?: string; doc?: unknown }
	| { ok: false; error: string };

/**
 * The guards that belong to the whole request rather than to one report: the
 * caller's role, and a reason when returning.
 *
 * Kept separate from the per-report body because the two surfaces report them
 * differently — `reviewReport` throws, and so does a batch (a caller who may not
 * review at all gets no per-row outcomes), while a row the state machine refuses
 * is only that row's business.
 */
const batchRefusal = (
	actor: ActorUser,
	action: string,
	reason?: string,
): { ok: false; error: string } | null => {
	if (!isManagerViewer(actor.level) && !isOrgLeaderLevel(actor.level)) {
		return { ok: false, error: "شما اجازه بررسی گزارش‌ها را ندارید" };
	}
	if (action === "return" && !reason?.trim()) {
		return { ok: false, error: "برای برگشت گزارش، ثبت دلیل الزامی است" };
	}
	return null;
};

/**
 * Throw when the caller may not start this batch at all.
 *
 * Called before the scope is resolved and before any row is touched, so a caller
 * without permission learns that in one error rather than once per report.
 */
export const assertReviewBatchAllowed = ({
	actor,
	action,
	reason,
}: {
	actor: ActorUser;
	action: string;
	reason?: string;
}): void => {
	const refusal = batchRefusal(actor, action, reason);
	if (refusal) throwError(refusal.error);
};

/** The scope every review action must run inside. */
export const reviewScopeFor = async (
	actor: ActorUser,
): Promise<Record<string, unknown>> => await getOrgReportBase(actor);

/**
 * Apply one transition to one report.
 *
 * `model` pins the collection. Left out, the id is looked for in `incident_report`
 * first and then in `accident`, because both share the review lifecycle and the
 * oversight console lists them as one stream — while a caller that names the model
 * keeps its own collection boundary.
 *
 * Returns a refusal instead of throwing: a batch must be able to report that one
 * row was refused without losing the rest — including when that row's own id is
 * malformed.
 */
export const applyReviewTransition = async ({
	model,
	reportId,
	action,
	reason,
	actor,
	scope,
	projection,
}: {
	model?: ReviewModel;
	reportId: string;
	action: string;
	reason?: string;
	actor: ActorUser;
	scope: Record<string, unknown>;
	/** What to return for the updated document; `_id` when the caller wants none. */
	projection?: Document;
}): Promise<ReviewOutcome> => {
	const refusal = batchRefusal(actor, action, reason);
	if (refusal) return refusal;

	// `objectIdValidation` is `instance(ObjectId) || size(string(), 24)` — length only.
	// A 24-character string of non-hex characters passes both validators and then
	// makes `new ObjectId` throw a BSONError, which would escape this function and
	// take the rest of a batch with it. A malformed id is one row's problem, so it is
	// answered as one row's refusal.
	if (!ObjectId.isValid(reportId)) {
		return { ok: false, error: "شناسه گزارش نامعتبر است" };
	}

	const id = new ObjectId(reportId);
	const filters = { _id: id, ...scope };
	const readProjection = {
		_id: 1,
		review_status: 1,
		sync_status: 1,
		synced_at: 1,
	};

	let target: ReviewModel | null = null;
	let report: StoredReviewRow | null = null;
	for (
		const candidate of (model ? [model] : [
			incident_report,
			accident as unknown as ReviewModel,
		]) as ReviewModel[]
	) {
		const found = (await candidate.findOne({
			filters,
			projection: readProjection,
		})) as StoredReviewRow | null;
		if (found) {
			target = candidate;
			report = found;
			break;
		}
	}
	if (!target || !report) {
		return { ok: false, error: "گزارش یافت نشد یا دسترسی ندارید" };
	}

	const storedStatus = report.review_status;
	const current = (storedStatus || "submitted") as
		| "submitted"
		| "under_review"
		| "returned"
		| "approved"
		| "completed";
	if (!transitions[current]?.includes(action)) {
		return {
			ok: false,
			error: `تغییر وضعیت گزارش از ${current} امکان‌پذیر نیست`,
		};
	}
	if (!REVIEWABLE_SYNC.includes(report.sync_status ?? "")) {
		return {
			ok: false,
			error: "گزارش قبل از بررسی باید با موفقیت همگام‌سازی شود",
		};
	}

	const now = new Date();
	const nextStatus = actionStatus[action];
	const update: Record<string, unknown> = {
		review_status: nextStatus,
		reviewed_at: now,
		updatedAt: now,
	};
	// The acknowledgement half of the transition: a `queued` row becomes `synced`
	// as it enters review, because the reviewer holding it is the acknowledgement
	// it was waiting for. `synced_at` is written once, like everywhere else — a row
	// that already carries an instant keeps the moment it arrived.
	if (report.sync_status !== "synced") {
		update.sync_status = "synced";
		if (!report.synced_at) update.synced_at = now;
	}
	if (action === "return") update.review_reason = reason?.trim();
	if (action === "complete") update.completed_at = now;
	const unset = action !== "return" ? { review_reason: "" } : {};

	const historyEntry = {
		action: action === "start_review"
			? "started_review"
			: action === "return"
			? "returned"
			: action === "approve"
			? "approved"
			: "completed",
		reason: reason?.trim(),
		action_at: now,
		reviewer: {
			_id: new ObjectId(actor._id),
			first_name: actor.first_name ?? "",
			last_name: actor.last_name ?? "",
		},
	};

	// The stored status is part of the filter on purpose: a report that moved under
	// us (a second reviewer, or a resubmission) must not be transitioned twice.
	const doc = await target.findOneAndUpdate({
		filter: {
			_id: id,
			...(storedStatus
				? { review_status: current }
				: { review_status: { $exists: false } }),
		},
		update: {
			$set: update,
			$push: { review_history: historyEntry },
			...(Object.keys(unset).length ? { $unset: unset } : {}),
		} as any,
		projection: projection ?? { _id: 1 },
	});

	return { ok: true, review_status: nextStatus, doc };
};
