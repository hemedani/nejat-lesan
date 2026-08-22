import { setTokens, setUser, grantAccess } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getSyncStatusFn } from "./getSyncStatus.fn.ts";
import { getSyncStatusValidator } from "./getSyncStatus.val.ts";

export const getSyncStatusSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: getSyncStatusFn,
		actName: "getSyncStatus",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager", "Patrol"],
			}),
		],
		validator: getSyncStatusValidator(),
	});