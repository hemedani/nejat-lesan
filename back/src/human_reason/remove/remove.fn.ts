import { type ActFn, ObjectId } from "@deps";
import { human_reason } from "../../../mod.ts";

export const removeFn: ActFn = async (body) => {
  const {
    set: { _id, hardCascade },
    get,
  } = body.details;

  return await human_reason.deleteOne({
    filter: { _id: new ObjectId(_id as string) },
    hardCascade: hardCascade || false,
  });
};
