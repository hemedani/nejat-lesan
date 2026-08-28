import { array, object, objectIdValidation, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const addAnnouncementValidator = () => {
	return object({
		set: object({
			title: string(),
			body: string(),
			priority: optional(string()),
			target_roles: optional(array(string())),
			target_user_ids: optional(array(objectIdValidation)),
			target_patrol_units: optional(array(string())),
			expires_at: optional(string()),
			attachmentIds: optional(array(objectIdValidation)),
		}),
		get: selectStruct("announcement", 1),
	});
};
