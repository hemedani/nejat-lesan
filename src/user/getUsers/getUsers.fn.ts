import type { ActFn } from "@deps";
import { user } from "../../../mod.ts";

export const getUsersFn: ActFn = async (body) => {
  const {
    set: { levels, page, limit },
    get,
  } = body.details;

  const pipeline = [];

  levels && pipeline.push({ $match: { levels: levels } });

  pipeline.push({ $sort: { _id: -1 } });
  pipeline.push({ $skip: (page - 1) * limit });
  pipeline.push({ $limit: limit });

  return await user
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
