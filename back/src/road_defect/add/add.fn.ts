import { type ActFn } from "@deps";
import { road_defect, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const { ...rest } = set;

  return await road_defect.insertOne({
    doc: rest,
    relations: {
      registrer: {
        _ids: user._id,
      },
    },
    projection: get,
  });
};
