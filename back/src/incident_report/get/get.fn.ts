import { type ActFn, ObjectId } from "@deps";
import { coreApp, incident_report } from "../../../mod.ts";
import { getReportScope } from "../../accident/reportScope.ts";
import { type MyContext, throwError } from "@lib";

/**
 * Read one report, scoped to what the caller may see.
 *
 * Scoped rather than open, because a report describes where an incident happened
 * and who filed it — the same tenancy rule `accident.get` follows.
 */
export const getFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const report = await incident_report.findOne({
		filters: {
			_id: new ObjectId(set._id as string),
			...getReportScope(user),
		},
		projection: get,
	});
	if (!report) return throwError("گزارش یافت نشد یا دسترسی ندارید");

	return report;
};
