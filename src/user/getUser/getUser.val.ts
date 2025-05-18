import { object, objectIdValidation } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const getUserValidator = () => {
  return object({
    set: object({
      _id: objectIdValidation,
    }),
    get: selectStruct("user", 2),
  });
};
