import { type ActFn, ObjectId } from "@deps";
import { accident, coreApp, shift } from "../../../mod.ts";
import { type MyContext, throwError } from "@lib";
import { getReportScope } from "../reportScope.ts";

const reviewStatuses = [
	"submitted",
	"under_review",
	"returned",
	"approved",
	"completed",
];
const syncStatuses = ["draft", "queued", "syncing", "synced", "rejected"];

const getSet = (body: any) => body.details.set || {};

const countReports = async (base: Record<string, unknown>) => {
	const sync = Object.fromEntries(
		await Promise.all(
			syncStatuses.map(async (status) => [
				status,
				await accident.countDocument({
					filter: { ...base, sync_status: status },
				}),
			]),
		),
	);
	const review = Object.fromEntries(
		await Promise.all(
			reviewStatuses.map(async (status) => [
				status,
				await accident.countDocument({
					filter: status === "submitted"
						? {
							...base,
							$or: [
								{ review_status: "submitted" },
								{ review_status: { $exists: false } },
							],
						}
						: { ...base, review_status: status },
				}),
			]),
		),
	);
	return { sync, review };
};

const recentReports = async (
	base: Record<string, unknown>,
	get: Record<string, unknown>,
	page = 1,
	limit = 20,
) => await accident.find({
	filters: base,
	projection: get as any,
}).sort({ reported_at: -1, _id: -1 }).skip((page - 1) * limit).limit(limit)
	.toArray();

export const getReporterDashboardFn: ActFn = async (body) => {
	const context = coreApp.contextFns.getContextModel() as MyContext;
	if (context.user.level !== "Patrol") {
		return throwError("این داشبورد فقط برای مأمور گشت است");
	}
	const set = getSet(body);
	const get = body.details.get;
	const base = getReportScope(context.user);
	const activeShift = await shift.findOne({
		filters: {
			"officer._id": new ObjectId(context.user._id),
			status: "active",
		},
		projection: {
			_id: 1,
			shift_type: 1,
			status: 1,
			start_at: 1,
			end_at: 1,
			patrol_unit: 1,
			vehicle: 1,
		},
	});
	return {
		activeShift,
		summary: await countReports(base),
		recentReports: await recentReports(
			base,
			get,
			set.page || 1,
			Math.min(set.limit || 10, 50),
		),
	};
};

export const getManagerDashboardFn: ActFn = async (body) => {
	const context = coreApp.contextFns.getContextModel() as MyContext;
	if (context.user.level !== "Manager" && context.user.level !== "Ghost") {
		return throwError("شما اجازه مشاهده داشبورد مدیر را ندارید");
	}
	const set = getSet(body);
	const base = getReportScope(context.user, set.userId);
	return {
		summary: await countReports(base),
		recentReports: await recentReports(
			base,
			body.details.get as any,
			set.page || 1,
			Math.min(set.limit || 20, 100),
		),
	};
};

export const getManagerReportsFn: ActFn = async (body) => {
	const context = coreApp.contextFns.getContextModel() as MyContext;
	if (context.user.level !== "Manager" && context.user.level !== "Ghost") {
		return throwError("شما اجازه مشاهده گزارش‌ها را ندارید");
	}
	const set = getSet(body);
	const filters = getReportScope(context.user, set.userId);
	if (set.reviewStatus) filters.review_status = set.reviewStatus;
	if (set.syncStatus) filters.sync_status = set.syncStatus;
	return await recentReports(
		filters,
		body.details.get as any,
		set.page || 1,
		Math.min(set.limit || 50, 100),
	);
};
