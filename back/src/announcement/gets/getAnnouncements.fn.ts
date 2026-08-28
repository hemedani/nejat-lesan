import { type ActFn, ObjectId } from "@deps";
import { announcement, announcement_read, coreApp } from "../../../mod.ts";
import { buildVisibleAnnouncementsFilter } from "../visibleFilter.ts";
import type { MyContext } from "@lib";

export const getAnnouncementsFn: ActFn = async (body) => {
	const {
		set: { page, limit, skip, priority, is_active },
		get,
	} = body.details;
	const context: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;
	const actor = context.user;

	let filter: Record<string, any>;

	if (actor.level === "Patrol") {
		// Patrol: only announcements targeted at their role / active unit / self
		filter = await buildVisibleAnnouncementsFilter(actor);
	} else {
		// Manager & Ghost: full list
		filter = { is_active: is_active !== "false" };
	}

	if (priority) {
		filter.priority = priority;
	}

	const finalSkip = skip || (limit || 50) * ((page || 1) - 1);

	const items: any[] = await announcement
		.find({
			filters: filter,
			projection: get,
		})
		.skip(finalSkip)
		.limit(limit || 50)
		.toArray();

	// --- per-user read state ---
	const ids = items.map((item) => new ObjectId(item._id));
	const readDocs: any[] = ids.length
		? await announcement_read
			.find({
				filters: {
					"reader._id": new ObjectId(actor._id),
					"announcement._id": { $in: ids },
				},
				projection: { announcement: 1, read_at: 1 },
			})
			.toArray()
		: [];

	const readMap = new Map<string, Date>();
	for (const read of readDocs) {
		readMap.set(
			read.announcement?._id?.toString(),
			read.read_at,
		);
	}

	const withReadState = items.map((item) => ({
		...item,
		is_read: readMap.has(item._id.toString()),
		read_at: readMap.get(item._id.toString()) ?? null,
	}));

	// unread first, then newest first
	withReadState.sort((a, b) => {
		if (a.is_read !== b.is_read) return a.is_read ? 1 : -1;
		return new Date(b.createdAt).getTime() -
			new Date(a.createdAt).getTime();
	});

	return withReadState;
};
