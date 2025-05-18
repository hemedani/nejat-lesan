import { type ActFn, ObjectId } from "@deps";
import { coreApp, user } from "../../../mod.ts";
import { type MyContext, throwError } from "@lib";

export const toggleFavArticleFn: ActFn = async (body) => {
  const {
    user: { _id },
  }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const {
    set: { articleId },
    get,
  } = body.details;

  const foundedUser = await user.findOne({
    filters: { _id },
    projection: {
      favArticles: {
        _id: 1,
      },
    },
  });

  /*
   * 	@LOG @DEBUG @INFO
   * 	This log written by ::==> {{ `` }}
   *
   * 	Please remove your log after debugging
   */
  console.log(" ============= ");
  console.group("foundedUser ------ ");
  console.log();
  console.info({ foundedUser }, " ------ ");
  console.log();
  console.groupEnd();
  console.log(" ============= ");

  if (foundedUser) {
    if (foundedUser.favArticles && foundedUser.favArticles.length > 0) {
      const foundedArticleInUser = foundedUser.favArticles.find(
        (article: any) => article._id.equals(new ObjectId(articleId))
      );

      if (foundedArticleInUser) {
        return await user.removeRelation({
          filters: { _id },
          relations: {
            favArticles: {
              _ids: [new ObjectId(articleId)],
              relatedRelations: {
                favByUsers: true,
              },
            },
          },
          projection: get,
        });
      } else {
        return await user.addRelation({
          filters: { _id },
          relations: {
            favArticles: {
              _ids: [new ObjectId(articleId)],
              relatedRelations: {
                favByUsers: true,
              },
            },
          },
          projection: get,
        });
      }
    } else {
      return await user.addRelation({
        filters: { _id },
        relations: {
          favArticles: {
            _ids: [new ObjectId(articleId)],
            relatedRelations: {
              favByUsers: true,
            },
          },
        },
        projection: get,
      });
    }
  } else {
    throwError("can not find this user");
  }
};
