import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { validateFn } from "./validate.fn.ts";
import { validateValidator } from "./validate.val.ts";

/**
 * No `grantAccess`: any authenticated caller may check their own answers. The act
 * reads no other org's data — it validates a form they already hold.
 */
export const validateSetup = () =>
	coreApp.acts.setAct({
		schema: "form_definition",
		fn: validateFn,
		actName: "validate",
		preAct: [setTokens, setUser],
		validator: validateValidator(),
	});
