import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getForPatrolFn } from "./getForPatrol.fn.ts";
import { getForPatrolValidator } from "./getForPatrol.val.ts";

export const getForPatrolSetup = () =>
	coreApp.acts.setAct({
		schema: "accident_process",
		fn: getForPatrolFn,
		actName: "getForPatrol",
		preAct: [setTokens, setUser],
		validator: getForPatrolValidator(),
	});
