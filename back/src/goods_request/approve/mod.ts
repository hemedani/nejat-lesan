import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { approveFn } from "./approve.fn.ts";
import { approveValidator } from "./approve.val.ts";

export const approveSetup = () =>
	coreApp.acts.setAct({
		schema: "goods_request",
		fn: approveFn,
		actName: "approve",
		preAct: [setTokens, setUser],
		validator: approveValidator(),
	});
