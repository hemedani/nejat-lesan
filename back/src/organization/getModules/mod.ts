import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getModulesFn } from "./getModules.fn.ts";
import { getModulesValidator } from "./getModules.val.ts";

export const getModulesSetup = () =>
	coreApp.acts.setAct({
		schema: "organization",
		fn: getModulesFn,
		actName: "getModules",
		preAct: [setTokens, setUser],
		validator: getModulesValidator(),
	});
