import { object, objectIdValidation, optional } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const updateUserRelationsValidator = () => {
  return object({
    set: object({
      _id: objectIdValidation,
      avatar: optional(objectIdValidation),
      nationalCard: optional(objectIdValidation),
    }),
    get: selectStruct("user", 1),
  });
};
