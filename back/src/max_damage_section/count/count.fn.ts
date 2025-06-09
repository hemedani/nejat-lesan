import type { ActFn, Document } from "@deps";
import { max_damage_section } from "../../../mod.ts";

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

  const foundedItemsLength = await max_damage_section.countDocument({
    filter: filters,
  });

  return { qty: foundedItemsLength };
};
