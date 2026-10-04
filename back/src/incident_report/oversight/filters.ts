import { ObjectId } from "@deps";
import { organization } from "../../../mod.ts";
import type { MyContext } from "@lib";
import {
	getOrgReportBase,
	isManagerViewer,
	isOrgLeaderLevel,
} from "../../accident/reportScope.ts";

type ActorUser = MyContext["user"];

/**
 * The server-enforced scope for the oversight console.
 *
 * Reuses `getOrgReportBase` rather than `getReportScope`, because `getReportScope`
 * handles only Patrol and Manager/Ghost and **throws** for org leaders — which is
 * exactly the audience of this console.
 *
 * `organizationId` is deliberately ignored for org leaders. Narrowing on
 * `organization._id` would AND the filter and hide every legacy record, since those
 * carry no organization at all; the scope's `$or` already matches both populations.
 */
export const resolveOversightScope = async (
	actor: ActorUser,
	organizationId?: string,
): Promise<Record<string, unknown>> => {
	if (isOrgLeaderLevel(actor.level)) {
		return await getOrgReportBase(actor);
	}

	if (isManagerViewer(actor.level)) {
		if (!organizationId || !ObjectId.isValid(organizationId)) {
			return { "officer.level": "Patrol" };
		}
		const org = await organization.findOne({
			filters: { _id: new ObjectId(organizationId) },
			projection: { "road._id": 1 },
		});
		const orgRoadId = (org as { road?: { _id?: ObjectId } })?.road?._id;

		// Same two clauses the org-leader scope uses, so a Manager narrowing to one
		// organization still sees that organization's legacy reports.
		const clauses: Record<string, unknown>[] = [
			{ "organization._id": new ObjectId(organizationId) },
		];
		if (orgRoadId) clauses.push({ "road._id": orgRoadId });
		return { "officer.level": "Patrol", $or: clauses };
	}

	throw new Error("شما اجازه مشاهده گزارش‌ها را ندارید");
};
