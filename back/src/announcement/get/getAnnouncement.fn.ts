import { type ActFn, ObjectId } from "@deps";
import { coreApp, announcement } from "../../../mod.ts";
import { throwError } from "@lib";

export const getAnnouncementFn: ActFn = async (body) => {
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

	return result;
};