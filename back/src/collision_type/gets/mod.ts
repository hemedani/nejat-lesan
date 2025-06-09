import { coreApp } from "../../../mod.ts";
import { getsFn } from "./gets.fn.ts";
import { getsValidator } from "./gets.val.ts";

export const getsSetup = () =>
  coreApp.acts.setAct({
    schema: "collision_type",
    fn: getsFn,
    actName: "gets",
    validator: getsValidator(),
  });
