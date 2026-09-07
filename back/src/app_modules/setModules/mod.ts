import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { setModulesFn } from "./setModules.fn.ts";
import { setModulesValidator } from "./setModules.val.ts";

export const setModulesSetup = () =>
	coreApp.acts.setAct({
		schema: "app_modules",
		fn: setModulesFn,
		actName: "setModules",
		preAct: [
			setTokens,
			setUser,
			// فقط Ghost — مشتری هرگز این حساب را تحویل نمی‌گیرد.
			grantAccess({
				levels: ["Ghost"],
			}),
		],
		validator: setModulesValidator(),
	});
