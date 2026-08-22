import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { assignShiftFn } from "./assignShift.fn.ts";
import { assignShiftValidator } from "./assignShift.val.ts";

export const assignShiftSetup = () =>
	coreApp.acts.setAct({
		schema: "shift",
		fn: assignShiftFn,
		actName: "assignShift",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: assignShiftValidator(),
	});