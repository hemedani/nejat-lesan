import { type ActFn, ObjectId } from "@deps";
import { coreApp, incident_report } from "../../../mod.ts";
import { type MyContext, throwError } from "@lib";

/**
 * An officer re-submits a report the control centre returned for correction.
 *
 * Only the officer who filed it can do this, and only while the report sits in
 * `returned` — the same rule an accident report follows.
 */

export const resubmitReportFn: ActFn = async (body) => {
	const context = coreApp.contextFns.getContextModel() as MyContext;
	if (context.user.level !== "Patrol") {
		return throwError(
			"فقط مأمور گزارش‌دهنده می‌تواند گزارش را ارسال مجدد کند",
		);
	}
	const { reportId } = body.details.set;
	const filter = {
		_id: new ObjectId(reportId as string),
		"officer._id": new ObjectId(context.user._id),
		review_status: "returned" as const,
	};
	const report = await incident_report.findOne({
		filters: filter,
		projection: { _id: 1, sync_status: 1 },
	});
	if (!report) {
		return throwError("گزارش برگشت‌خورده‌ای برای ارسال مجدد یافت نشد");
	}
	if (report.sync_status !== "synced") {
		return throwError("گزارش باید ابتدا با موفقیت همگام‌سازی شود");
	}

	const now = new Date();
	return await incident_report.findOneAndUpdate({
		filter,
		update: {
			$set: {
				review_status: "submitted",
				reviewed_at: now,
				updatedAt: now,
			},
			$unset: { review_reason: "" },
			$push: {
				review_history: {
					action: "resubmitted",
					action_at: now,
					reviewer: {
						_id: new ObjectId(context.user._id),
						first_name: context.user.first_name ?? "",
						last_name: context.user.last_name ?? "",
					},
				},
			},
		},
		projection: body.details.get,
	});
};
