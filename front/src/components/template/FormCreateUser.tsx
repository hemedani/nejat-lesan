"use client";
import { useForm, SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import SelectBox from "../atoms/Select";
import { UploadImage } from "@/components/molecules/UploadFile";
import { ToastNotify } from "@/utils/helper";
import MyInput from "../atoms/MyInput";
import { createUser } from "@/app/actions/user/createUser";
import { DatePicker } from "zaman";
import { ReqType } from "@/types/declarations/selectInp";

export const UserCreateSchema = z.object({
  first_name: z.string().min(1, "نام الزامی است"),
  last_name: z.string().min(1, "نام خانوادگی الزامی است"),
  father_name: z.string(),
  mobile: z.string().regex(/^\d{10}$/, "شماره تماس باید 10 رقم باشد"),
  gender: z.enum(["Male", "Female"], { message: "جنسیت الزامی است" }),
  birth_date: z.date().optional(),
  summary: z.string().optional(),
  national_number: z.string().regex(/^\d{10}$/, "کد ملی باید 10 رقم باشد"),
  address: z.string(),
  level: z.enum(["Ordinary", "Manager", "Editor", "Ghost"], {
    message: "سطح الزامی است",
  }),
  is_verified: z.boolean(),
  nationalCard: z.string().optional(), // برای کارت ملی
  avatar: z.string().optional(), // برای عکس پروفایل
});

export type UserFormCreateSchemaType = z.infer<typeof UserCreateSchema>;
export type UserSetObj = ReqType["main"]["user"]["addUser"]["set"];

export const FormCreateUser = ({ token }: { token?: string }) => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm<UserSetObj>({
    resolver: zodResolver(UserCreateSchema),
  });

  const onSubmit: SubmitHandler<UserSetObj> = async (data) => {
    const createdUser = await createUser(data);

    if (createdUser.success) {
      ToastNotify("success", "مقاله با موفقیت ایجاد شد");
      router.replace("/admin/users");
    } else {
      ToastNotify("error", createdUser.body.message);
    }
  };

  return (
    <div className="p-8">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 bg-gray-100 p-6 border rounded-lg"
      >
        <div className="w-full flex flex-wrap">
          <div className="w-1/2 p-4">
            <span className="text-sm font-medium text-gray-700">
              عکس پروفایل
            </span>
            <UploadImage
              inputName="avatar"
              setUploadedImage={(uploaded: string) =>
                setValue("avatar", uploaded)
              }
              type="image"
              token={token}
            />
          </div>
          <div className="w-1/2 p-4">
            <span className="text-sm font-medium text-gray-700">
              عکس کارت ملی
            </span>
            <UploadImage
              inputName="nationalCard"
              setUploadedImage={(uploaded: string) =>
                setValue("nationalCard", uploaded)
              }
              type="image"
              token={token}
            />
          </div>

          <MyInput
            label="نام"
            register={register}
            name="first_name"
            errMsg={errors.father_name?.message}
          />
          <MyInput
            label="نام خانوادگی"
            register={register}
            name="last_name"
            errMsg={errors.last_name?.message}
          />
          <MyInput
            label="نام پدر"
            register={register}
            name="father_name"
            errMsg={errors.father_name?.message}
          />
          <MyInput
            label="شماره موبایل"
            register={register}
            name="mobile"
            type="number"
            errMsg={errors.mobile?.message}
          />
          <MyInput
            label="شماره شماسنامه"
            register={register}
            name="national_number"
            type="number"
            errMsg={errors.national_number?.message}
          />
          <MyInput
            label="شماره ملی"
            register={register}
            name="national_number"
            errMsg={errors.national_number?.message}
          />
          <MyInput
            label="آدرس"
            register={register}
            name="address"
            errMsg={errors.address?.message}
          />
          <MyInput
            label="توضیحات"
            register={register}
            name="summary"
            errMsg={errors.summary?.message}
          />

          <div className={`w-1/2 p-4 flex flex-col gap-1`}>
            <label htmlFor="birth_date">تاریخ تولد</label>
            <DatePicker
              className={`text-gray-600 border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 bg-gray-100 ${errors.birth_date?.message ? "border-red-500" : "border-gray-300"}`}
              onChange={(e) => setValue("birth_date", e.value)}
            />
            {errors.birth_date?.message && (
              <span className="text-red-500 text-xs">
                {errors.birth_date?.message}
              </span>
            )}
          </div>

          <SelectBox
            label="جنسیت"
            name="gender"
            setValue={setValue}
            errMsg={errors.gender?.message}
            options={[
              { value: "Male", label: "مرد" },
              { value: "Female", label: "زن" },
            ]}
          />
          <SelectBox
            label="سطح دسترسی"
            name="level"
            setValue={setValue}
            errMsg={errors.level?.message}
            options={[
              { value: "Manager", label: "مدیر" },
              { value: "Editor", label: "ویرایشگر" },
              { value: "Normal", label: "عادی" },
            ]}
          />
        </div>

        <div className="w-full flex gap-4 justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="p-4 px-8 bg-blue-600 text-white text-center font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
          >
            ارسال
          </button>
        </div>
      </form>
    </div>
  );
};
