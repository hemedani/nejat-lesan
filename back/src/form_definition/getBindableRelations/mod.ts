import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getBindableRelationsFn } from "./getBindableRelations.fn.ts";
import { getBindableRelationsValidator } from "./getBindableRelations.val.ts";

export const getBindableRelationsSetup = () =>
	coreApp.acts.setAct({
		schema: "form_definition",
		fn: getBindableRelationsFn,
		actName: "getBindableRelations",
		preAct: [setTokens, setUser],
		validator: getBindableRelationsValidator(),
	});
