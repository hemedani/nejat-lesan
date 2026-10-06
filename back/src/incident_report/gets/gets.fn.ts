import { type ActFn, ObjectId } from "@deps";
import { coreApp, incident_report } from "../../../mod.ts";
import { getOrgReportBase } from "../../accident/reportScope.ts";
import { type MyContext } from "@lib";

/**
 * List reports the caller may see.
 *
 * `form_definition_id` is the filter that replaced the old incident-type filter:
 * an organization groups its reports by the form it authored, and that grouping is
 * now the only classification there is.
 */
export const getsFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const {
		page = 1,
		limit = 50,
		skip,
		form_definition_id,
		sync_status,
		review_status,
		search,
	} = set;

	const filters: Record<string, unknown> = {
		...(await getOrgReportBase(user)),
	};
	if (form_definition_id) {
		filters.form_definition_id = new ObjectId(form_definition_id as string);
	}
	if (sync_status) filters.sync_status = sync_status;
	if (review_status) filters.review_status = review_status;
	if (search) filters.form_title = { $regex: String(search), $options: "i" };

	return await incident_report
		.find({ filters, projection: get })
		.sort({ reported_at: -1, _id: -1 })
		.skip(skip ?? limit * (page - 1))
		.limit(limit)
		.toArray();
};
