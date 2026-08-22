import { type ActFn, ObjectId } from "@deps";
import { coreApp, announcement } from "../../../mod.ts";
import { throwError } from "@lib";

export const markAnnouncementReadFn: ActFn = async (body) => {
	const {
		set: { announcementId },
		get,
	} = body.details;

	const result = await announcement.findOne({
		filters: { _id: new ObjectId(announcementId as string) },
		projection: get,
	});

	if (!result) {
		return throwError("اعلامیه یافت نشد");
	}

	// In a full implementation, we'd track read status per user
	// For now, just return the announcement
	return result;
};