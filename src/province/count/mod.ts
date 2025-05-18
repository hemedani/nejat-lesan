import { grantAccess, setTokens, setUser } from "@lib";
import { countFn } from "./count.fn.ts";
import { countValidator } from "./count.val.ts";
import { coreApp } from "../../../mod.ts";

export const countSetup = () =>
	coreApp.acts.setAct({
		schema: "province",
		fn: countFn,
		actName: "count",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: countValidator(),
	});
