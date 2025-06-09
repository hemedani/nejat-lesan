import { type ActFn, type Infer, object, ObjectId } from "@deps";
import { fault_status } from "../../../mod.ts";
import { shared_relation_pure } from "@model";

export const updateFn: ActFn = async (body) => {
  const {
    set: { _id, name },
    get,
  } = body.details;

  const pureStruct = object(shared_relation_pure);
  const updateObj: Partial<Infer<typeof pureStruct>> = {
    updatedAt: new Date(),
  };

  name && (updateObj.name = name);

  return await fault_status.findOneAndUpdate({
    filter: { _id: new ObjectId(_id as string) },
    update: {
      $set: updateObj,
    },
    projection: get,
  });
};
