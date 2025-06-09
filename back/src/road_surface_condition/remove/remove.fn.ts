import { type ActFn, ObjectId } from "@deps";
import { road_surface_condition } from "../../../mod.ts";

export const removeFn: ActFn = async (body) => {
  const {
    set: { _id, hardCascade },
    get,
  } = body.details;

  return await road_surface_condition.deleteOne({
    filter: { _id: new ObjectId(_id as string) },
    hardCascade: hardCascade || false,
  });
};
