import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { registerEmergencyFn } from "./register.fn.ts";
import { registerEmergencyValidator } from "./register.val.ts";

export const registerEmergencySetup = () =>
	coreApp.acts.setAct({
		schema: "emergency",
		fn: registerEmergencyFn,
		actName: "register",
		preAct: [setTokens, setUser],
		validator: registerEmergencyValidator(),
	});
