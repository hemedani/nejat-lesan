import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { removeOrphanFilesFn } from "./removeOrphanFiles.fn.ts";
import { removeOrphanFilesValidator } from "./removeOrphanFiles.val.ts";

export const removeOrphanFilesSetup = () =>
	coreApp.acts.setAct({
		schema: "file",
		fn: removeOrphanFilesFn,
		actName: "removeOrphans",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: removeOrphanFilesValidator(),
	});
