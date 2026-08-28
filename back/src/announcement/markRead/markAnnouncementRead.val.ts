import { object, objectIdValidation } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const markAnnouncementReadValidator = () => {
	return object({
		set: object({
			announcementId: objectIdValidation,
		}),
		get: selectStruct("announcement", 1),
	});
};
