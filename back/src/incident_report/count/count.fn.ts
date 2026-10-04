import { type ActFn, ObjectId } from "@deps";
import { coreApp, incident_report } from "../../../mod.ts";
import { getReportScope } from "../../accident/reportScope.ts";
import { type MyContext } from "@lib";

/**
 * Count reports the caller may see.
 *
 * Scoped, deliberately: the unfiltered `accident.count` returned a `total` that
 * counted every organization's rows, which is how non-accident reports ended up
 * inside the "total accidents" figure in the first place.
 */
export const countFn: ActFn = async (body) => {
	const { set } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const { form_definition_id, sync_status, review_status } = set;
	const filters: Record<string, unknown> = { ...getReportScope(user) };
	if (form_definition_id) {
		filters.form_definition_id = new ObjectId(form_definition_id as string);
	}
	if (sync_status) filters.sync_status = sync_status;
	if (review_status) filters.review_status = review_status;

	return { qty: await incident_report.countDocument({ filter: filters }) };
};
