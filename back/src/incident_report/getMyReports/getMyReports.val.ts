import { enums, number, object, objectIdValidation, optional } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const getMyReportsValidator = () =>
	object({
		set: object({
			page: optional(number()),
			limit: optional(number()),
			sync_status: optional(
				enums(["draft", "queued", "syncing", "synced", "rejected"]),
			),
			/** Filter by the form a report was filed under. */
			form_definition_id: optional(objectIdValidation),
			/** Manager/Ghost only — one officer's reports. */
			userId: optional(objectIdValidation),
		}),
		get: selectStruct("incident_report", 1),
	});
