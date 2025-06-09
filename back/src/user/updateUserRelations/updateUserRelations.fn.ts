import { type ActFn, ObjectId, type TInsertRelations } from "@deps";
import type { userRelations } from "@lib";
import { user } from "../../../mod.ts";

export const updateUserRelationsFn: ActFn = async (body) => {
  const {
    set: { _id, avatar, nationalCard },
    get,
  } = body.details;

  const relations: TInsertRelations<typeof userRelations> = {};

  avatar &&
    (relations.avatar = {
      _ids: new ObjectId(avatar),
      relatedRelations: {},
    });

  nationalCard &&
    (relations.nationalCard = {
      _ids: new ObjectId(nationalCard),
      relatedRelations: {},
    });

  /*
   * 	@LOG @DEBUG @INFO
   * 	This log written by ::==> {{ `` }}
   *
   * 	Please remove your log after debugging
   */
  console.log(" ============= ");
  console.group("relations ------ ");
  console.log();
  console.info({ relations }, " ------ ");
  console.log();
  console.groupEnd();
  console.log(" ============= ");

  return await user.addRelation({
    filters: { _id: new ObjectId(_id) },
    relations,
    projection: get,
    replace: true,
  });
};
