import { addAnnouncementSetup } from "./add/mod.ts";
import { getAnnouncementsSetup } from "./gets/mod.ts";
import { getAnnouncementSetup } from "./get/mod.ts";
import { markAnnouncementReadSetup } from "./markRead/mod.ts";
import { getUnreadCountSetup } from "./getUnreadCount/mod.ts";

export const announcementSetup = () => {
	addAnnouncementSetup();
	getAnnouncementsSetup();
	getAnnouncementSetup();
	markAnnouncementReadSetup();
	getUnreadCountSetup();
};