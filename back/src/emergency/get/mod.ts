import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getEmergencyFn } from "./get.fn.ts";
import { getEmergencyValidator } from "./get.val.ts";

export const getEmergencySetup = () =>
	coreApp.acts.setAct({
		schema: "emergency",
		fn: getEmergencyFn,
		actName: "get",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: getEmergencyValidator(),
	});
