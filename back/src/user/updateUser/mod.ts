import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { updateUserFn } from "./updateUser.fn.ts";
import { updateUserValidator } from "./updateUser.val.ts";

export const updateUserSetup = () =>
	coreApp.acts.setAct({
		schema: "user",
		fn: updateUserFn,
		actName: "updateUser",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: updateUserValidator(),
		validationRunType: "create",
	});
