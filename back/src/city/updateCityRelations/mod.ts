import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { updateCityRelationsFn } from "./updateCityRelations.fn.ts";
import { updateCityRelationsValidator } from "./updateCityRelations.val.ts";

export const updateCityRelationsSetup = () =>
	coreApp.acts.setAct({
		schema: "city",
		fn: updateCityRelationsFn,
		actName: "updateCityRelations",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Ghost", "Manager"],
			}),
		],
		validator: updateCityRelationsValidator(),
		validationRunType: "create",
	});
