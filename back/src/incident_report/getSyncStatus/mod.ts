import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getSyncStatusFn } from "./getSyncStatus.fn.ts";
import { getSyncStatusValidator } from "./getSyncStatus.val.ts";

export const getSyncStatusSetup = () =>
	coreApp.acts.setAct({
		schema: "incident_report",
		fn: getSyncStatusFn,
		actName: "getSyncStatus",
		preAct: [setTokens, setUser],
		validator: getSyncStatusValidator(),
	});
