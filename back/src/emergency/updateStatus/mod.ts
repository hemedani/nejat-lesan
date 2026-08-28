import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { updateEmergencyStatusFn } from "./updateEmergencyStatus.fn.ts";
import { updateEmergencyStatusValidator } from "./updateEmergencyStatus.val.ts";

export const updateEmergencyStatusSetup = () =>
	coreApp.acts.setAct({
		schema: "emergency",
		fn: updateEmergencyStatusFn,
		actName: "updateStatus",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: updateEmergencyStatusValidator(),
	});
