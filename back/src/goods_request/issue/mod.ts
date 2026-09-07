import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { issueFn } from "./issue.fn.ts";
import { issueValidator } from "./issue.val.ts";

export const issueSetup = () =>
	coreApp.acts.setAct({
		schema: "goods_request",
		fn: issueFn,
		actName: "issue",
		preAct: [setTokens, setUser],
		validator: issueValidator(),
	});
