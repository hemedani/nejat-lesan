import { type ActFn, ObjectId } from "@deps";
import { accident, accident_review, coreApp } from "../../../mod.ts";
import { throwError, type MyContext } from "@lib";
import { getReportScope } from "../reportScope.ts";

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

export const reviewReportFn: ActFn = async (body) => {
	const { reportId, action, reason } = body.details.set;
	const { get } = body.details;
	const context = coreApp.contextFns.getContextModel() as MyContext;
	const actor = context.user;

	if (actor.level !== "Manager" && actor.level !== "Ghost") {
		return throwError("شما اجازه بررسی گزارش‌ها را ندارید");
	}
	if (action === "return" && !reason?.trim()) {
		return throwError("برای برگشت گزارش، ثبت دلیل الزامی است");
	}

	const report = await accident.findOne({
		filters: {
			_id: new ObjectId(reportId as string),
			...getReportScope(actor),
		},
		projection: { _id: 1, review_status: 1, sync_status: 1 },
	});
	if (!report) return throwError("گزارش یافت نشد یا دسترسی ندارید");

	const storedStatus = report.review_status as string | undefined;
	const current = (storedStatus || "submitted") as
		"submitted" | "under_review" | "returned" | "approved" | "completed";
	if (!transitions[current]?.includes(action as string)) {
		return throwError(`تغییر وضعیت گزارش از ${current} امکان‌پذیر نیست`);
	}
	if (report.sync_status !== "synced") {
		return throwError("گزارش قبل از بررسی باید با موفقیت همگام‌سازی شود");
	}

	const now = new Date();
	const nextStatus = actionStatus[action as string];
	const update: Record<string, unknown> = {
		review_status: nextStatus,
		reviewed_at: now,
		updatedAt: now,
	};
	if (action === "return") update.review_reason = reason?.trim();
	if (action === "complete") update.completed_at = now;
	const unset = action !== "return" ? { review_reason: "" } : {};

	const result = await accident.findOneAndUpdate({
		filter: {
			_id: new ObjectId(reportId as string),
			...(storedStatus
				? { review_status: current }
				: { review_status: { $exists: false } }),
		},
		update: {
			$set: update,
			...(Object.keys(unset).length ? { $unset: unset } : {}),
		} as any,
		projection: get,
	});

	await accident_review.insertOne({
		doc: {
			action: action === "start_review"
				? "started_review"
				: action === "return"
				? "returned"
				: action === "approve"
				? "approved"
				: "completed",
			reason: reason?.trim(),
			action_at: now,
			createdAt: now,
			updatedAt: now,
		},
		relations: {
			accident: { _ids: [new ObjectId(reportId as string)] },
			reviewer: { _ids: [new ObjectId(actor._id)] },
		},
		projection: { _id: 1 },
	});

	return result;
};
