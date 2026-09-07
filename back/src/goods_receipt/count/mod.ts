import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { countFn } from "./count.fn.ts";
import { countValidator } from "./count.val.ts";

export const countSetup = () =>
	coreApp.acts.setAct({
		schema: "goods_receipt",
		fn: countFn,
		actName: "count",
		preAct: [setTokens, setUser],
		validator: countValidator(),
	});
