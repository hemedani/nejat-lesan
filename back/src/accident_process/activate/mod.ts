import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { activateFn } from "./activate.fn.ts";
import { activateValidator } from "./activate.val.ts";

export const activateSetup = () =>
	coreApp.acts.setAct({
		schema: "accident_process",
		fn: activateFn,
		actName: "activate",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager", "OrgHead", "UnitHead"],
			}),
		],
		validator: activateValidator(),
	});
