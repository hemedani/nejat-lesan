import type { ActFn, Document } from "@deps";
import { city_zone } from "../../../mod.ts";

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

  const foundedItemsLength = await city_zone.countDocument({
    filter: filters,
  });

  return { qty: foundedItemsLength };
};
