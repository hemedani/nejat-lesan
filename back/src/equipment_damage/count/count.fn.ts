import type { ActFn, Document } from "@deps";
import { equipment_damage } from "../../../mod.ts";

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

  const foundedItemsLength = await equipment_damage.countDocument({
    filter: filters,
  });

  return { qty: foundedItemsLength };
};
