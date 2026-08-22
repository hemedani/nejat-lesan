import { coreApp } from "../../../mod.ts";
import { mobileLoginFn } from "./mobileLogin.fn.ts";
import { mobileLoginValidator } from "./mobileLogin.val.ts";

export const mobileLoginSetup = () =>
	coreApp.acts.setAct({
		schema: "user",
		actName: "mobileLogin",
		fn: mobileLoginFn,
		validator: mobileLoginValidator(),
	});