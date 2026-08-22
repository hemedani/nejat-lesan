import { setTokens, setUser, grantAccess } from "@lib";
import { coreApp } from "../../../mod.ts";
import { markAnnouncementReadFn } from "./markAnnouncementRead.fn.ts";
import { markAnnouncementReadValidator } from "./markAnnouncementRead.val.ts";

export const markAnnouncementReadSetup = () =>
	coreApp.acts.setAct({
		schema: "announcement",
		fn: markAnnouncementReadFn,
		actName: "markRead",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Patrol"],
			}),
		],
		validator: markAnnouncementReadValidator(),
	});