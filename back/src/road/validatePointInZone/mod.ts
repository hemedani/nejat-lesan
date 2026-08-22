import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { validatePointInZoneFn } from "./validatePointInZone.fn.ts";
import { validatePointInZoneValidator } from "./validatePointInZone.val.ts";

export const validatePointInZoneSetup = () =>
	coreApp.acts.setAct({
		schema: "road",
		fn: validatePointInZoneFn,
		actName: "validatePointInZone",
		preAct: [
			setTokens,
			setUser,
		],
		validator: validatePointInZoneValidator(),
	});