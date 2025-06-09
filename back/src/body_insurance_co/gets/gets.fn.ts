import type { ActFn } from "@deps";
import { body_insurance_co } from "../../../mod.ts";

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

  return await body_insurance_co
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
