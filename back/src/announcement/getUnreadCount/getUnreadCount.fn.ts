import { type ActFn, ObjectId } from "@deps";
import { announcement, announcement_read, coreApp } from "../../../mod.ts";
import { buildVisibleAnnouncementsFilter } from "../visibleFilter.ts";
import type { MyContext } from "@lib";
import { throwError } from "@lib";

export const getUnreadCountFn: ActFn = async (body) => {
	const context: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;
	const actor = context.user;

	if (actor.level !== "Patrol") {
		return throwError("شما اجازه این کار را ندارید");
	}

	// All announcements visible to this officer (active + non-expired + targeted)
	const filter = await buildVisibleAnnouncementsFilter(actor);

	const totalCount = await announcement.countDocument({ filter });

	if (totalCount === 0) return { count: 0 };

	// Subtract the ones this officer has already read
	const visibleIds = await announcement
		.find({ filters: filter, projection: { _id: 1 } })
		.toArray();

	const readCount = await announcement_read.countDocument({
		filter: {
			"reader._id": new ObjectId(actor._id),
			"announcement._id": {
				$in: visibleIds.map((doc) => new ObjectId(doc._id)),
			},
		},
	});

	return { count: totalCount - readCount };
};
