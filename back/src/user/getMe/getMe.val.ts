import { object } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const getMeValidator = () => {
  return object({
    set: object({}),
    get: selectStruct("user", 2),
  });
};
