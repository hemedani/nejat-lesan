import { type ActFn, ObjectId } from "@deps";
import { accident, coreApp } from "../../../mod.ts";
import { type MyContext, throwError } from "@lib";

export const getMyReportsFn: ActFn = async (body) => {
	const {
		set: { page, limit, status, userId },
		get,
	} = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const currentPage = page || 1;
	const perPage = limit || 20;
	const skip = perPage * (currentPage - 1);

	// --- 1. Resolve whose reports are returned ---
	const filters: Record<string, unknown> = {};

	if (user.level === "Patrol") {
		// Officers always see their own reports
		filters["officer._id"] = user._id;
	} else if (
		user.level === "Manager" || user.level === "Ghost"
	) {
		// Manager/Ghost may query any officer, or all reports when no userId
		if (userId) filters["officer._id"] = new ObjectId(userId as string);
	} else {
		throwError("شما اجازه مشاهده گزارش‌ها را ندارید");
	}

	if (status) filters.sync_status = status;

	return await accident
		.find({
			filters,
			projection: get,
		})
		.sort({ reported_at: -1, _id: -1 })
		.skip(skip)
		.limit(perPage)
		.toArray();
};
