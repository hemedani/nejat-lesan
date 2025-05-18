import { type ActFn, ensureDir, ObjectId } from "@deps";
import { coreApp, file } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const uploadFileFn: ActFn = async (body) => {
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const { formData, type, ...rest } = body.details.set;

  const fileToUpload: File = formData.get("file") as File;

  const fileName = `${new ObjectId()}-${fileToUpload.name}`;
  const uploadDir =
    type === "image"
      ? "./uploads/images"
      : type === "video"
      ? "./uploads/videos"
      : "./uploads/docs";
  await ensureDir(uploadDir);
  await Deno.writeFile(`${uploadDir}/${fileName}`, fileToUpload.stream());

  return await file.insertOne({
    doc: {
      name: fileName,
      type: fileToUpload.type,
      size: fileToUpload.size,
      ...rest,
    },
    relations: {
      uploader: {
        _ids: new ObjectId(user._id),
        relatedRelations: {
          uploadedAssets: true,
        },
      },
    },
    projection: body.details.get,
  });
};
