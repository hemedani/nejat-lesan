import { type ActFn, ObjectId } from "@deps";
import { accident, coreApp } from "../../../mod.ts";
import { getOrgReportBase } from "../reportScope.ts";
import type { MyContext } from "@lib";

/**
 * Read one accident, scoped to what the caller may see.
 *
 * Scoped rather than open, and symmetric with `incident_report.get`: the oversight
 * console merges both collections under one scope, so one console and one detail
 * route must resolve to one set of rules.
 *
 * The scope is `getOrgReportBase`, not `getReportScope`. The latter handles only
 * Patrol and Manager/Ghost and **throws** for org leaders — the audience this act
 * now serves — so it is the wrong helper here by construction.
 *
 * This narrows what a caller may read, which is the point: a Patrol officer is
 * limited to their own reports, and an org leader to their organization's. The
 * scope is deliberately the same one the lists use, so a row reachable from
 * `/patrol-manager/reports` (which resolves through `getOrgReportBase` too) always
 * opens, and no list and detail can disagree.
 */
export const getFn: ActFn = async (body) => {
	const {
		set: { _id },
		get,
	} = body.details;
	const { user } = coreApp.contextFns.getContextModel() as MyContext;

	return await accident
		.aggregation({
			pipeline: [
				{
					$match: {
						_id: new ObjectId(_id as string),
						...(await getOrgReportBase(user)),
					},
				},
			],
			projection: get,
		})
		.toArray();
};
