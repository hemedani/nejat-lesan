import { type ActFn, ObjectId } from "@deps";
import { road_situation } from "../../../mod.ts";

export const getFn: ActFn = async (body) => {
  const {
    set: { _id },
    get,
  } = body.details;

  return await road_situation
    .aggregation({
      pipeline: [{ $match: { _id: new ObjectId(_id as string) } }],
      projection: get,
    })
    .toArray();
};
