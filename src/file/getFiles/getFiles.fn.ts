import type { ActFn } from "@deps";
import { file } from "../../../mod.ts";

export const getFilesFn: ActFn = async (body) => {
  const {
    set: { page, limit, name, type },
    get,
  } = body.details;

  const pipeline = [];

  name && pipeline.push({ $match: { name } });
  type &&
    pipeline.push({
      $match: {
        type:
          type === "image"
            ? "image/jpeg"
            : type === "pdf"
            ? "application/pdf"
            : "video/mp4",
      },
    });

  pipeline.push({ $sort: { _id: -1 } });
  pipeline.push({ $skip: (page - 1) * limit });
  pipeline.push({ $limit: limit });

  return await file
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};
