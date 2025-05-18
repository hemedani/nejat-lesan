import { object, objectIdValidation } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const toggleFavArticleValidator = () => {
  return object({
    set: object({
      articleId: objectIdValidation,
    }),
    get: selectStruct("user", 1),
  });
};
