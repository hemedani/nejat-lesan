import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getReferenceOptionsFn } from "./getReferenceOptions.fn.ts";
import { getReferenceOptionsValidator } from "./getReferenceOptions.val.ts";

export const getReferenceOptionsSetup = () =>
	coreApp.acts.setAct({
		schema: "form_definition",
		fn: getReferenceOptionsFn,
		actName: "getReferenceOptions",
		preAct: [setTokens, setUser],
		validator: getReferenceOptionsValidator(),
	});
