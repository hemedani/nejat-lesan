"use client";
import { SubmitHandler, useForm } from "react-hook-form";
import Cookies from "js-cookie";
import { updateRelationUser } from "@/app/actions/user/updateRelationUser";
import { ToastNotify } from "@/utils/helper";
import { useRouter } from "next/navigation";
import { ReqType, userSchema } from "@/types/declarations/selectInp";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { UploadImage } from "@/components/molecules/UploadFile";

export const UpdateUserRelationSchema = z.object({
  _id: z.string(),
  avatar: z.any().optional(), // برای عکس پروفایل
  nationalCard: z.any().optional(), // برای کارت ملی
});

export type UpdateUserRelationSchemaType = z.infer<
  typeof UpdateUserRelationSchema
>;
export type UpdateUserRelationSet =
  ReqType["main"]["user"]["updateUserRelations"]["set"];

export const EditUserRelations = ({
  _id,
  avatar,
  national_card,
  isOwn,
}: userSchema & { isOwn?: boolean }) => {
  const { handleSubmit, setValue } = useForm<UpdateUserRelationSet>({
    resolver: zodResolver(UpdateUserRelationSchema),
  });

  const token = Cookies.get("token");
  const router = useRouter();

  const onSubmit: SubmitHandler<UpdateUserRelationSet> = async (formData) => {
    const updatedUserRelations = await updateRelationUser({
      get: { first_name: 1 },
      set: { ...formData, _id: _id! },
    });
    if (updatedUserRelations.success) {
      ToastNotify("success", "با موقیت ویرایش شد");
      router.replace(isOwn ? "/user" : "/admin/users");
    } else {
      ToastNotify("error", "با خطا مواجه شد");
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex flex-wrap w-full">
        <div className="w-1/2 p-4">
          <span>عکس پروفایل کاربری</span>
          <UploadImage
            inputName="avatar"
            setUploadedImage={(uploaded: string) =>
              setValue("avatar", uploaded)
            }
            type="image"
            token={token}
            filePath={avatar ? avatar.name : undefined}
          />
        </div>
        <div className="w-1/2 p-4">
          <span>عکس کارت ملی</span>
          <UploadImage
            inputName="nationalCard"
            setUploadedImage={(uploaded: string) =>
              setValue("nationalCard", uploaded)
            }
            type="image"
            token={token}
            filePath={national_card ? national_card.name : undefined}
          />
        </div>
      </div>
      <div className="w-full flex gap-4 justify-end">
        <button
          type="submit"
          className="p-4 px-8 bg-blue-600 text-white text-center font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
        >
          ارسال
        </button>
      </div>
    </form>
  );
};
