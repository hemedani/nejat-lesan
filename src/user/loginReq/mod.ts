import { coreApp } from "../../../mod.ts";
import { loginReqUserFn } from "./loginReqUser.fn.ts";
import { loginUserReqValidator } from "./loginReqUser.val.ts";

export const loginReqUserSetup = () =>
  coreApp.acts.setAct({
    schema: "user",
    actName: "loginReq",
    fn: loginReqUserFn,
    validator: loginUserReqValidator(),
  });
