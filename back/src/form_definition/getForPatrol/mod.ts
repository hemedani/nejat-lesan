import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getForPatrolFn } from "./getForPatrol.fn.ts";
import { getForPatrolValidator } from "./getForPatrol.val.ts";

/**
 * No `grantAccess`: any authenticated caller may resolve the active definition
 * for the org it belongs to. Authorization is by org resolution, not by level —
 * a patrol officer and an org head must both be able to render the form.
 */
export const getForPatrolSetup = () =>
	coreApp.acts.setAct({
		schema: "form_definition",
		fn: getForPatrolFn,
		actName: "getForPatrol",
		preAct: [setTokens, setUser],
		validator: getForPatrolValidator(),
	});
