import { type ActFn, ObjectId } from "@deps";
import { announcement, announcement_read, coreApp } from "../../../mod.ts";
import { type MyContext, throwError } from "@lib";

export const markAnnouncementReadFn: ActFn = async (body) => {
	const context: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;
	const actor = context.user;

	const {
		set: { announcementId },
		get,
	} = body.details;

	const announcementDoc = await announcement.findOne({
		filters: { _id: new ObjectId(announcementId as string) },
		projection: { _id: 1 },
	});

	if (!announcementDoc) {
		return throwError("اعلامیه یافت نشد");
	}

	const alreadyRead = await announcement_read.findOne({
		filters: {
			"announcement._id": new ObjectId(announcementId as string),
			"reader._id": new ObjectId(actor._id),
		},
		projection: { _id: 1 },
	});

	if (!alreadyRead) {
		const now = new Date();
		await announcement_read.insertOne({
			doc: {
				read_at: now,
				createdAt: now,
				updatedAt: now,
			},
			relations: {
				announcement: { _ids: new ObjectId(announcementId as string) },
				reader: { _ids: new ObjectId(actor._id) },
			},
			projection: { _id: 1 },
		});
	}

	return await announcement.findOne({
		filters: { _id: new ObjectId(announcementId as string) },
		projection: get,
	});
};
