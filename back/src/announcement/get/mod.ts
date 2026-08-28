import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getAnnouncementFn } from "./getAnnouncement.fn.ts";
import { getAnnouncementValidator } from "./getAnnouncement.val.ts";

export const getAnnouncementSetup = () =>
	coreApp.acts.setAct({
		schema: "announcement",
		fn: getAnnouncementFn,
		actName: "get",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager", "Patrol"],
			}),
		],
		validator: getAnnouncementValidator(),
	});
