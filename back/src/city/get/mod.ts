import { coreApp } from "../../../mod.ts";
import { getFn } from "./get.fn.ts";
import { getValidator } from "./get.val.ts";

export const getSetup = () =>
	coreApp.acts.setAct({
		schema: "city",
		fn: getFn,
		actName: "get",
		validator: getValidator(),
	});
