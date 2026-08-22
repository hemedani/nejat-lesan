import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getShiftsFn } from "./getShifts.fn.ts";
import { getShiftsValidator } from "./getShifts.val.ts";

export const getShiftsSetup = () =>
	coreApp.acts.setAct({
		schema: "shift",
		fn: getShiftsFn,
		actName: "getShifts",
		preAct: [setTokens, setUser],
		validator: getShiftsValidator(),
	});