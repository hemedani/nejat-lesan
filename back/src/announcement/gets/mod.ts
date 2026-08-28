import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getAnnouncementsFn } from "./getAnnouncements.fn.ts";
import { getAnnouncementsValidator } from "./getAnnouncements.val.ts";

export const getAnnouncementsSetup = () =>
	coreApp.acts.setAct({
		schema: "announcement",
		fn: getAnnouncementsFn,
		actName: "gets",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager", "Patrol"],
			}),
		],
		validator: getAnnouncementsValidator(),
	});
