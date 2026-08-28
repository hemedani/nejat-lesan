"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import SelectBox from "@/components/atoms/Select";
import { UploadImage } from "@/components/molecules/UploadFile";
import { ToastNotify } from "@/utils/helper";
import MyInput from "@/components/atoms/MyInput";
import MyDateInput from "@/components/atoms/MyDateInput";
import CustomCheckbox from "@/components/atoms/CustomCheckbox";
import { Button } from "@/components/atoms/Button";
import { createUser } from "@/app/actions/user/createUser";
import { ReqType } from "@/types/declarations/selectInp";

const patrolOfficerSchema = z.object({
  first_name: z.string().min(1, "نام الزامی است"),
  last_name: z.string().min(1, "نام خانوادگی الزامی است"),
  father_name: z.string().min(1, "نام پدر الزامی است"),
  mobile: z.string().regex(/^[0-9]{10}$/, "شماره تماس باید 10 رقم باشد"),
  email: z.string().email("فرمت ایمیل معتبر نیست"),
  password: z
    .string()
    .min(8, "رمز عبور باید حداقل 8 کاراکتر باشد")
    .max(100, "رمز عبور باید حداکثر 100 کاراکتر باشد"),
  national_number: z
    .string()
    .optional()
    .refine((value) => !value || /^[0-9]{10}$/.test(value), "کد ملی باید 10 رقم باشد"),
  personnel_code: z
    .string()
    .min(1, "کد پرسنلی برای مأمور گشت الزامی است")
    .regex(/^[0-9]+$/, "کد پرسنلی باید فقط شامل ارقام باشد"),
  address: z.string().min(1, "آدرس الزامی است"),
  summary: z.string().optional(),
  birth_date: z.string().optional(),
  gender: z.enum(["Male", "Female"], { message: "جنسیت الزامی است" }),
  is_verified: z.boolean(),
  is_active: z.boolean(),
  avatar: z.string().optional(),
  nationalCard: z.string().optional(),
  patrol_permissions: z
    .object({
      can_submit_accident: z.boolean().optional(),
      can_view_map: z.boolean().optional(),
      can_receive_announcements: z.boolean().optional(),
      can_register_emergency: z.boolean().optional(),
      can_view_reports: z.boolean().optional(),
    })
    .optional(),
});

type PatrolOfficerFormData = z.infer<typeof patrolOfficerSchema>;

const patrolPermissionFields = [
  { key: "can_submit_accident", label: "ثبت گزارش تصادف" },
  { key: "can_view_map", label: "مشاهده نقشه" },
  { key: "can_receive_announcements", label: "دریافت اطلاعیه‌ها" },
  { key: "can_register_emergency", label: "ثبت وضعیت اضطراری" },
  { key: "can_view_reports", label: "مشاهده گزارش‌ها" },
] as const;

export function FormCreatePatrolUser() {
  const router = useRouter();
  const {
    register,
    setValue,
    watch,
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<PatrolOfficerFormData>({
    resolver: zodResolver(patrolOfficerSchema),
    defaultValues: {
      is_verified: true,
      is_active: true,
      summary: "",
      birth_date: "",
      avatar: "",
      nationalCard: "",
      patrol_permissions: {},
    },
    mode: "onChange",
  });

  const onSubmit: SubmitHandler<PatrolOfficerFormData> = async (data) => {
    try {
      const backendData = {
        ...data,
        level: "Patrol",
      } as ReqType["main"]["user"]["addUser"]["set"];

      if (!data.avatar?.trim()) delete backendData.avatar;
      if (!data.nationalCard?.trim()) delete backendData.nationalCard;
      if (!data.summary?.trim()) delete backendData.summary;
      if (!data.birth_date?.trim()) {
        delete backendData.birth_date;
      } else {
        backendData.birth_date = new Date(data.birth_date);
      }
      if (!data.national_number?.trim()) delete backendData.national_number;

      const cleanedPermissions = data.patrol_permissions
        ? Object.fromEntries(
            Object.entries(data.patrol_permissions).filter(([, value]) => value === true),
          )
        : {};
      if (Object.keys(cleanedPermissions).length > 0) {
        backendData.patrol_permissions =
          cleanedPermissions as ReqType["main"]["user"]["addUser"]["set"]["patrol_permissions"];
      }

      const createdUser = await createUser(backendData);

      if (createdUser.success) {
        ToastNotify("success", "مأمور گشت با موفقیت ایجاد شد");
        router.replace("/patrol-manager/operations");
      } else {
        ToastNotify("error", createdUser.body?.message || "خطا در ایجاد مأمور گشت");
      }
    } catch {
      ToastNotify("error", "خطا در ارسال فرم");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="w-full flex flex-wrap">
        <div className="w-full sm:w-1/2 p-2">
          <span className="text-sm font-medium text-gray-700">عکس پروفایل</span>
          <UploadImage
            inputName="patrol-avatar"
            setUploadedImage={(uploaded: string) => setValue("avatar", uploaded)}
            type="image"
          />
        </div>
        <div className="w-full sm:w-1/2 p-2">
          <span className="text-sm font-medium text-gray-700">عکس کارت ملی</span>
          <UploadImage
            inputName="patrol-national-card"
            setUploadedImage={(uploaded: string) => setValue("nationalCard", uploaded)}
            type="image"
          />
        </div>

        <MyInput
          label="نام"
          register={register}
          name="first_name"
          errMsg={errors.first_name?.message}
          className="w-full sm:w-1/2 p-2"
        />
        <MyInput
          label="نام خانوادگی"
          register={register}
          name="last_name"
          errMsg={errors.last_name?.message}
          className="w-full sm:w-1/2 p-2"
        />
        <MyInput
          label="نام پدر"
          register={register}
          name="father_name"
          errMsg={errors.father_name?.message}
          className="w-full sm:w-1/2 p-2"
        />
        <MyInput
          label="کد پرسنلی"
          register={register}
          name="personnel_code"
          type="text"
          errMsg={errors.personnel_code?.message}
          className="w-full sm:w-1/2 p-2"
          placeholder="فقط عدد - مثال: 12345"
        />
        <MyInput
          label="شماره موبایل"
          register={register}
          name="mobile"
          type="text"
          errMsg={errors.mobile?.message}
          className="w-full sm:w-1/2 p-2"
          placeholder="مثال: 9123456789"
        />
        <MyInput
          label="ایمیل"
          register={register}
          name="email"
          type="email"
          errMsg={errors.email?.message}
          className="w-full sm:w-1/2 p-2"
          placeholder="مثال: officer@example.com"
        />
        <MyInput
          label="رمز عبور"
          register={register}
          name="password"
          type="password"
          errMsg={errors.password?.message}
          className="w-full sm:w-1/2 p-2"
          placeholder="حداقل 8 کاراکتر"
        />
        <MyInput
          label="کد ملی"
          register={register}
          name="national_number"
          type="text"
          errMsg={errors.national_number?.message}
          className="w-full sm:w-1/2 p-2"
          placeholder="اختیاری - مثال: 1234567890"
        />
        <MyInput
          label="آدرس"
          register={register}
          name="address"
          errMsg={errors.address?.message}
          className="w-full sm:w-1/2 p-2"
        />
        <MyInput
          label="توضیحات"
          register={register}
          name="summary"
          errMsg={errors.summary?.message}
          className="w-full sm:w-1/2 p-2"
          type="textarea"
        />

        <MyDateInput
          label="تاریخ تولد"
          name="birth_date"
          control={control}
          errMsg={errors.birth_date?.message}
          className="w-full sm:w-1/2 p-2"
          placeholder="انتخاب تاریخ تولد"
        />

        <SelectBox
          label="جنسیت"
          name="gender"
          setValue={setValue}
          errMsg={errors.gender?.message}
          options={[
            { value: "Male", label: "مرد" },
            { value: "Female", label: "زن" },
          ]}
          className="w-full sm:w-1/2 p-2"
        />
        <SelectBox
          label="وضعیت تایید"
          name="is_verified"
          setValue={(fieldName, value) => {
            setValue("is_verified", value === "true");
          }}
          errMsg={errors.is_verified?.message}
          options={[
            { value: "true", label: "تایید شده" },
            { value: "false", label: "تایید نشده" },
          ]}
          defaultValue={{ value: "true", label: "تایید شده" }}
          className="w-full sm:w-1/2 p-2"
        />
        <SelectBox
          label="وضعیت فعالیت"
          name="is_active"
          setValue={(fieldName, value) => {
            setValue("is_active", value === "true");
          }}
          errMsg={errors.is_active?.message}
          options={[
            { value: "true", label: "فعال" },
            { value: "false", label: "غیرفعال" },
          ]}
          defaultValue={{ value: "true", label: "فعال" }}
          className="w-full sm:w-1/2 p-2"
        />

        <div className="w-full p-2">
          <span className="text-sm font-medium text-gray-700">دسترسی‌های مأمور گشت</span>
          <div className="mt-2 grid grid-cols-1 gap-2 rounded-xl border border-gray-200 p-3 sm:grid-cols-2 lg:grid-cols-3">
            {patrolPermissionFields.map((field) => (
              <CustomCheckbox
                key={field.key}
                checked={!!watch(`patrol_permissions.${field.key}` as keyof PatrolOfficerFormData)}
                onChange={(checked) =>
                  setValue(
                    `patrol_permissions.${field.key}` as keyof PatrolOfficerFormData,
                    checked,
                  )
                }
                label={field.label}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
        <Button variant="neutral" onClick={() => router.replace("/patrol-manager/operations")}>
          انصراف
        </Button>
        <Button type="submit">ایجاد مأمور گشت</Button>
      </div>
    </form>
  );
}

export default FormCreatePatrolUser;
