import type { ActFn, Document } from "@deps";
import { insurance_co } from "../../../mod.ts";

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

  const foundedItemsLength = await insurance_co.countDocument({
    filter: filters,
  });

  return { qty: foundedItemsLength };
};
