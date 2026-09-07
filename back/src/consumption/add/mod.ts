import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { addFn } from "./add.fn.ts";
import { addValidator } from "./add.val.ts";

export const addSetup = () =>
	coreApp.acts.setAct({
		schema: "consumption",
		fn: addFn,
		actName: "add",
		preAct: [setTokens, setUser],
		validator: addValidator(),
		validationRunType: "create",
	});
