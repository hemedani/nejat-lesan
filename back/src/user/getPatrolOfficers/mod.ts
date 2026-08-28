import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getPatrolOfficersFn } from "./getPatrolOfficers.fn.ts";
import { getPatrolOfficersValidator } from "./getPatrolOfficers.val.ts";

export const getPatrolOfficersSetup = () =>
	coreApp.acts.setAct({
		schema: "user",
		fn: getPatrolOfficersFn,
		actName: "getPatrolOfficers",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: getPatrolOfficersValidator(),
	});
