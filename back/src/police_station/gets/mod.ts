import { coreApp } from "../../../mod.ts";
import { getsFn } from "./gets.fn.ts";
import { getsValidator } from "./gets.val.ts";

// Public act: the mobile station picker needs it without auth.
export const getsSetup = () =>
	coreApp.acts.setAct({
		schema: "police_station",
		fn: getsFn,
		actName: "gets",
		validator: getsValidator(),
	});
