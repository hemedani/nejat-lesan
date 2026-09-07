import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getQuestionModelsFn } from "./getQuestionModels.fn.ts";
import { getQuestionModelsValidator } from "./getQuestionModels.val.ts";

export const getQuestionModelsSetup = () =>
	coreApp.acts.setAct({
		schema: "accident_process",
		actName: "getQuestionModels",
		preAct: [setTokens, setUser],
		validator: getQuestionModelsValidator(),
		fn: getQuestionModelsFn,
	});
