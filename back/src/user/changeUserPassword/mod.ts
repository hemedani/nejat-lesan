import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { changeUserPasswordFn } from "./changeUserPassword.fn.ts";
import { changeUserPasswordValidator } from "./changeUserPassword.val.ts";

export const changeUserPasswordSetup = () =>
	coreApp.acts.setAct({
		schema: "user",
		actName: "changeUserPassword",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Ghost"],
			}),
		],
		validator: changeUserPasswordValidator(),
		fn: changeUserPasswordFn,
	});
