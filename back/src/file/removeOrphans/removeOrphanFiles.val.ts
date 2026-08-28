import { number, object, optional } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const removeOrphanFilesValidator = () => {
	return object({
		set: object({
			// Only files older than this many days are eligible
			olderThanDays: optional(number()),
		}),
		get: selectStruct("file", 1),
	});
};
