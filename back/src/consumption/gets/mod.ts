import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getsFn } from "./gets.fn.ts";
import { getsValidator } from "./gets.val.ts";

export const getsSetup = () =>
	coreApp.acts.setAct({
		schema: "consumption",
		fn: getsFn,
		actName: "gets",
		preAct: [setTokens, setUser],
		validator: getsValidator(),
	});
