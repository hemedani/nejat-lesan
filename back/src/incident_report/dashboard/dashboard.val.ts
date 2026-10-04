import { enums, number, object, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";

const statuses = enums([
	"submitted",
	"under_review",
	"returned",
	"approved",
	"completed",
]);
const syncStatuses = enums([
	"draft",
	"queued",
	"syncing",
	"synced",
	"rejected",
]);

export const dashboardValidator = () =>
	object({
		set: object({
			page: optional(number()),
			limit: optional(number()),
			reviewStatus: optional(statuses),
			syncStatus: optional(syncStatuses),
			/** Narrow the console to one of the organization's forms. */
			formDefinitionId: optional(string()),
			userId: optional(string()),
		}),
		get: selectStruct("incident_report", 2),
	});
