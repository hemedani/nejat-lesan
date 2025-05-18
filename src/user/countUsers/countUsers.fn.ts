import type { ActFn, Document } from "@deps";
import { user } from "../../../mod.ts";

export const countUsersFn: ActFn = async (body) => {
  const {
    set: { levels },
    get,
  } = body.details;

  const filter: Document = {};
  levels && (filter["levels"] = levels);

  const qty = await user.countDocument({
    filter,
  });

  return { qty };
};
