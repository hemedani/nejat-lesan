import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { receiveFn } from "./receive.fn.ts";
import { receiveValidator } from "./receive.val.ts";

export const receiveSetup = () =>
	coreApp.acts.setAct({
		schema: "goods_request",
		fn: receiveFn,
		actName: "receive",
		preAct: [setTokens, setUser],
		validator: receiveValidator(),
	});
