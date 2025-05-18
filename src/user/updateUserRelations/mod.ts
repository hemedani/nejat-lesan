import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { updateUserRelationsFn } from "./updateUserRelations.fn.ts";
import { updateUserRelationsValidator } from "./updateUserRelations.val.ts";
import { checkGhostUser } from "../addUser/mod.ts";

export const updateUserRelationsSetup = () =>
  coreApp.acts.setAct({
    schema: "user",
    fn: updateUserRelationsFn,
    actName: "updateUserRelations",
    preAct: [
      setTokens,
      setUser,
      grantAccess({
        levels: ["Ghost", "Manager"],
      }),
      checkGhostUser,
    ],
    validator: updateUserRelationsValidator(),
    validationRunType: "create",
  });
