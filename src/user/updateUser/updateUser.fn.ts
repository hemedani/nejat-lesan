import { type ActFn, ObjectId } from "@deps";
import { coreApp, user } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const updateUserFn: ActFn = async (body) => {
  const {
    user: { _id },
  }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const {
    set: { createdAt, ...rest },
    get,
  } = body.details;

  if (rest.registration_step === "personalInformation") {
    delete rest.registration_step;
  }

  return await user.findOneAndUpdate({
    filter: { _id: new ObjectId(_id) },
    update: {
      $set: rest,
    },
    projection: get,
  });
};
