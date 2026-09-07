import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { adjustFn } from "./adjust.fn.ts";
import { adjustValidator } from "./adjust.val.ts";

export const adjustSetup = () =>
	coreApp.acts.setAct({
		schema: "inventory",
		fn: adjustFn,
		actName: "adjust",
		preAct: [setTokens, setUser],
		validator: adjustValidator(),
	});
