import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../../mod.ts";
import { getOversightListFn } from "./getOversightList.fn.ts";
import { getOversightListValidator } from "./getOversightList.val.ts";

export const getOversightListSetup = () =>
	coreApp.acts.setAct({
		schema: "incident_report",
		actName: "getOversightList",
		// No `grantAccess`: the scope depends on the caller's organization, which only
		// the act can resolve. `resolveOversightScope` refuses every other level.
		preAct: [setTokens, setUser],
		fn: getOversightListFn,
		validator: getOversightListValidator(),
	});
