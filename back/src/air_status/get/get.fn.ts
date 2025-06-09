import { type ActFn, ObjectId } from "@deps";
import { air_status } from "../../../mod.ts";

export const getFn: ActFn = async (body) => {
  const {
    set: { _id },
    get,
  } = body.details;

  return await air_status
    .aggregation({
      pipeline: [{ $match: { _id: new ObjectId(_id as string) } }],
      projection: get,
    })
    .toArray();
};
