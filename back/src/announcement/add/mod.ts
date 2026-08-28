import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { addAnnouncementFn } from "./add.fn.ts";
import { addAnnouncementValidator } from "./add.val.ts";

export const addAnnouncementSetup = () =>
	coreApp.acts.setAct({
		schema: "announcement",
		fn: addAnnouncementFn,
		actName: "add",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: addAnnouncementValidator(),
		validationRunType: "create",
	});
