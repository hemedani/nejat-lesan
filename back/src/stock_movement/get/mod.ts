import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getFn } from "./get.fn.ts";
import { getValidator } from "./get.val.ts";

export const getSetup = () =>
	coreApp.acts.setAct({
		schema: "stock_movement",
		fn: getFn,
		actName: "get",
		preAct: [setTokens, setUser],
		validator: getValidator(),
	});
