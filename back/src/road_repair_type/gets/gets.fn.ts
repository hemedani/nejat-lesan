import type { ActFn } from "@deps";
import { road_repair_type } from "../../../mod.ts";

export const getsFn: ActFn = async (body) => {
  const {
    set: { page, limit, name },
    get,
  } = body.details;

  const pipeline = [];

  name &&
    pipeline.push({
      $match: {
        name: { $regex: new RegExp(name, "i") },
      },
    });

  pipeline.push({ $sort: { _id: -1 } });
  pipeline.push({ $skip: (page - 1) * limit });
  pipeline.push({ $limit: limit });

  return await road_repair_type
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
