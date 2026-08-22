import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { endShiftFn } from "./endShift.fn.ts";
import { endShiftValidator } from "./endShift.val.ts";

export const endShiftSetup = () =>
	coreApp.acts.setAct({
		schema: "shift",
		fn: endShiftFn,
		actName: "endShift",
		preAct: [setTokens, setUser],
		validator: endShiftValidator(),
	});