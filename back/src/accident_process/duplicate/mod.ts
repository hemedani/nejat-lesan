import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { duplicateFn } from "./duplicate.fn.ts";
import { duplicateValidator } from "./duplicate.val.ts";

export const duplicateSetup = () =>
	coreApp.acts.setAct({
		schema: "accident_process",
		fn: duplicateFn,
		actName: "duplicate",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager", "OrgHead", "UnitHead"],
			}),
		],
		validator: duplicateValidator(),
	});
