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
			userId: optional(string()),
		}),
		get: selectStruct("accident", 2),
	});
