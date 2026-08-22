import {
	enums,
	number,
	object,
	objectIdValidation,
	optional,
	string,
} from "@deps";
import { selectStruct } from "../../../mod.ts";

export const getMyReportsValidator = () => {
	return object({
		set: object({
			page: optional(number()),
			limit: optional(number()),
			// Filter by sync lifecycle state
			status: optional(
				enums(["draft", "queued", "syncing", "synced", "rejected"]),
			),
			// Manager/Ghost only — filter a specific officer's reports
			userId: optional(objectIdValidation),
		}),
		get: selectStruct("accident", 1),
	});
};