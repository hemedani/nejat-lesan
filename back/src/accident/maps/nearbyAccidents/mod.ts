import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../../mod.ts";
import { nearbyAccidentsFn } from "./nearbyAccidents.fn.ts";
import { nearbyAccidentsValidator } from "./nearbyAccidents.val.ts";

export const nearbyAccidentsSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: nearbyAccidentsFn,
		actName: "nearbyAccidents",
		preAct: [setTokens, setUser],
		validator: nearbyAccidentsValidator(),
	});
