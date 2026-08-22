import { type ActFn, ObjectId } from "@deps";
import { accident, accident_review, coreApp } from "../../../mod.ts";
import { throwError, type MyContext } from "@lib";

export const resubmitReportFn: ActFn = async (body) => {
	const context = coreApp.contextFns.getContextModel() as MyContext;
	if (context.user.level !== "Patrol") {
		return throwError("فقط مأمور گزارش‌دهنده می‌تواند گزارش را ارسال مجدد کند");
	}
	const { reportId } = body.details.set;
	const filter = {
		_id: new ObjectId(reportId as string),
		"officer._id": new ObjectId(context.user._id),
		review_status: "returned" as const,
	};
	const report = await accident.findOne({
		filters: filter,
		projection: { _id: 1, sync_status: 1 },
	});
	if (!report) return throwError("گزارش برگشت‌خورده‌ای برای ارسال مجدد یافت نشد");
	if (report.sync_status !== "synced") {
		return throwError("گزارش باید ابتدا با موفقیت همگام‌سازی شود");
	}

	const now = new Date();
	const result = await accident.findOneAndUpdate({
		filter,
		update: {
			$set: {
				review_status: "submitted",
				reviewed_at: now,
				updatedAt: now,
			},
			$unset: { review_reason: "" },
		},
		projection: body.details.get,
	});

	await accident_review.insertOne({
		doc: {
			action: "resubmitted",
			action_at: now,
			createdAt: now,
			updatedAt: now,
		},
		relations: {
			accident: { _ids: [new ObjectId(reportId as string)] },
			reviewer: { _ids: [new ObjectId(context.user._id)] },
		},
		projection: { _id: 1 },
	});

	return result;
};
