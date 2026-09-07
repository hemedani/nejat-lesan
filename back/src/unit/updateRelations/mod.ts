import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { updateRelationsFn } from "./updateRelations.fn.ts";
import { updateRelationsValidator } from "./updateRelations.val.ts";

export const updateRelationsSetup = () =>
	coreApp.acts.setAct({
		schema: "unit",
		fn: updateRelationsFn,
		actName: "updateRelations",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager", "OrgHead", "UnitHead"],
			}),
		],
		validator: updateRelationsValidator(),
	});
