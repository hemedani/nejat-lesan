import { type ActFn, ObjectId } from "@deps";
import { max_damage_section } from "../../../mod.ts";

export const removeFn: ActFn = async (body) => {
  const {
    set: { _id, hardCascade },
    get,
  } = body.details;

  return await max_damage_section.deleteOne({
    filter: { _id: new ObjectId(_id as string) },
    hardCascade: hardCascade || false,
  });
};
