import { type ActFn, ObjectId } from "@deps";
import { coreApp, incident_report } from "../../../mod.ts";
import { type MyContext, throwError } from "@lib";

/**
 * The officer's own report history.
 *
 * Mirrors `accident.getMyReports` except that the old `incidentType` filter is
 * replaced by `form_definition_id` — the form is the classification now.
 */
export const getMyReportsFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const { page = 1, limit = 20, sync_status, form_definition_id, userId } =
		set;

	const filters: Record<string, unknown> = {};

	if (user.level === "Patrol") {
		filters["officer._id"] = new ObjectId(user._id);
	} else if (user.level === "Manager" || user.level === "Ghost") {
		if (userId) filters["officer._id"] = new ObjectId(userId as string);
	} else {
		throwError("شما اجازه مشاهده گزارش‌ها را ندارید");
	}

	if (sync_status) filters.sync_status = sync_status;
	if (form_definition_id) {
		filters.form_definition_id = new ObjectId(form_definition_id as string);
	}

	return await incident_report
		.find({ filters, projection: get })
		.sort({ reported_at: -1, _id: -1 })
		.skip(limit * (page - 1))
		.limit(limit)
		.toArray();
};
