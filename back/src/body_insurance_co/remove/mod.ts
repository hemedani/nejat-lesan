import { grantAccess, setTokens, setUser } from "@lib";
import { removeFn } from "./remove.fn.ts";
import { removeValidator } from "./remove.val.ts";
import { coreApp } from "../../../mod.ts";

export const removeSetup = () =>
  coreApp.acts.setAct({
    schema: "body_insurance_co",
    actName: "remove",
    fn: removeFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess({
        levels: ["Manager"],
      }),
    ],
    validator: removeValidator(),
  });
