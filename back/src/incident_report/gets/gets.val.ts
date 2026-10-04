import {
	enums,
	number,
	object,
	objectIdValidation,
	optional,
	string,
} from "@deps";
import { selectStruct } from "../../../mod.ts";

export const getsValidator = () =>
	object({
		set: object({
			page: optional(number()),
			limit: optional(number()),
			skip: optional(number()),
			form_definition_id: optional(objectIdValidation),
			sync_status: optional(
				enums(["draft", "queued", "syncing", "synced", "rejected"]),
			),
			review_status: optional(
				enums([
					"submitted",
					"under_review",
					"returned",
					"approved",
					"completed",
				]),
			),
			search: optional(string()),
		}),
		get: selectStruct("incident_report", 1),
	});
