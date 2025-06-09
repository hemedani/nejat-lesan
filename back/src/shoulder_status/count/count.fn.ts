import type { ActFn, Document } from "@deps";
import { shoulder_status } from "../../../mod.ts";

export const countFn: ActFn = async (body) => {
  const {
    set: { name },
    get,
  } = body.details;

  const filters: Document = {};

  name &&
    (filters["name"] = {
      $regex: new RegExp(name, "i"),
    });

  const foundedItemsLength = await shoulder_status.countDocument({
    filter: filters,
  });

  return { qty: foundedItemsLength };
};
