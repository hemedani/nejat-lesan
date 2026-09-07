import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { checkReorderFn } from "./checkReorder.fn.ts";
import { checkReorderValidator } from "./checkReorder.val.ts";

export const checkReorderSetup = () =>
	coreApp.acts.setAct({
		schema: "inventory",
		fn: checkReorderFn,
		actName: "checkReorder",
		preAct: [setTokens, setUser],
		validator: checkReorderValidator(),
	});
