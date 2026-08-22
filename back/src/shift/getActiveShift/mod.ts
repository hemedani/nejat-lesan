import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getActiveShiftFn } from "./getActiveShift.fn.ts";
import { getActiveShiftValidator } from "./getActiveShift.val.ts";

export const getActiveShiftSetup = () =>
	coreApp.acts.setAct({
		schema: "shift",
		fn: getActiveShiftFn,
		actName: "getActiveShift",
		preAct: [setTokens, setUser],
		validator: getActiveShiftValidator(),
	});