import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../../mod.ts";
import { getOversightStatsFn } from "./getOversightStats.fn.ts";
import { getOversightStatsValidator } from "./getOversightStats.val.ts";

export const getOversightStatsSetup = () =>
	coreApp.acts.setAct({
		schema: "incident_report",
		actName: "getOversightStats",
		// No `grantAccess`: the scope depends on the caller's organization, which only
		// the act can resolve. `resolveOversightScope` refuses every other level.
		preAct: [setTokens, setUser],
		fn: getOversightStatsFn,
		validator: getOversightStatsValidator(),
	});
