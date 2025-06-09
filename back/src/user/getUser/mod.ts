import { coreApp } from "../../../mod.ts";
import { getUserFn } from "./getUser.fn.ts";
import { getUserValidator } from "./getUser.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";

export const getUserSetup = () =>
  coreApp.acts.setAct({
    schema: "user",
    actName: "getUser",
    preAct: [
      setTokens,
      setUser,
      grantAccess({
        levels: ["Manager", "Examiner"],
      }),
    ],
    validator: getUserValidator(),
    fn: getUserFn,
  });
