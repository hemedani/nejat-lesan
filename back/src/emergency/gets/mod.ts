import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getEmergenciesFn } from "./gets.fn.ts";
import { getEmergenciesValidator } from "./gets.val.ts";

export const getEmergenciesSetup = () =>
	coreApp.acts.setAct({
		schema: "emergency",
		fn: getEmergenciesFn,
		actName: "gets",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: getEmergenciesValidator(),
	});
