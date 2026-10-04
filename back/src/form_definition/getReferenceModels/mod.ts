import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getReferenceModelsFn } from "./getReferenceModels.fn.ts";
import { getReferenceModelsValidator } from "./getReferenceModels.val.ts";

export const getReferenceModelsSetup = () =>
	coreApp.acts.setAct({
		schema: "form_definition",
		fn: getReferenceModelsFn,
		actName: "getReferenceModels",
		preAct: [setTokens, setUser],
		validator: getReferenceModelsValidator(),
	});
