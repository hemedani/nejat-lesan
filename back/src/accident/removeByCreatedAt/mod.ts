import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { removeByCreatedAtFn } from "./removeByCreatedAt.fn.ts";
import { removeByCreatedAtValidator } from "./removeByCreatedAt.val.ts";

export const removeByCreatedAtSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		actName: "removeByCreatedAt",
		fn: removeByCreatedAtFn,
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Enterprise"],
			}),
		],
		validator: removeByCreatedAtValidator(),
	});
