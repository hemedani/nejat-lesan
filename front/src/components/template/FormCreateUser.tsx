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
import MyDateInput from "../atoms/MyDateInput";
import { ReqType } from "@/types/declarations/selectInp";
import dynamic from "next/dynamic";
import { SelectOption } from "../atoms/MyAsyncMultiSelect";
import { useCallback, useState } from "react";
import { gets as getCitiesAction } from "@/app/actions/city/gets";

const AsyncSelect = dynamic(() => import("react-select/async"), { ssr: false });

export const UserCreateSchema = z.object({
  first_name: z.string().min(1, "نام الزامی است"),
  last_name: z.string().min(1, "نام خانوادگی الزامی است"),
  father_name: z.string().min(1, "نام پدر الزامی است"),
  mobile: z.string().regex(/^[0-9]{10}$/, "شماره تماس باید 10 رقم باشد"),
  gender: z.enum(["Male", "Female"], { message: "جنسیت الزامی است" }),
  birth_date: z.string().optional(),
  summary: z.string().optional(),
  national_number: z.string().regex(/^[0-9]{10}$/, "کد ملی باید 10 رقم باشد"),
  address: z.string().min(1, "آدرس الزامی است"),
  level: z.enum(["Ghost", "Manager", "Editor", "Ordinary"], {
    message: "سطح الزامی است",
  }),
  is_verified: z.boolean(),
  nationalCard: z.string().optional(),
  avatar: z.string().optional(),
  citySettingId: z.string().optional(),
});

export type UserFormData = z.infer<typeof UserCreateSchema>;
export type UserSetObj = ReqType["main"]["user"]["addUser"]["set"];

export const FormCreateUser = ({ token }: { token?: string }) => {
  const router = useRouter();
  const [selectedCity, setSelectedCity] = useState<SelectOption | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isValid, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(UserCreateSchema),
    defaultValues: {
      is_verified: false,
      summary: "",
      birth_date: "",
      nationalCard: "",
      avatar: "",
    },
    mode: "onChange",
  });

  // Load cities options
  const loadCitiesOptions = async (
    inputValue?: string,
  ): Promise<SelectOption[]> => {
    const setParams: { limit: number; page: number; name?: string } = {
      limit: 20,
      page: 1,
    };
    if (inputValue) {
      setParams.name = inputValue;
    }
    try {
      const response = await getCitiesAction({
        set: setParams,
        get: { _id: 1, name: 1 },
      });
      if (response && response.success) {
        return response.body.map((item: { _id: string; name: string }) => ({
          value: item._id,
          label: item.name,
        }));
      }
    } catch (error) {
      console.error("Error loading cities:", error);
    }
    return [];
  };

  // Handle city selection
  const handleCitySelect = useCallback(
    async (selectedOption: SelectOption | null) => {
      setSelectedCity(selectedOption);
      if (selectedOption) {
        setValue("citySettingId", selectedOption.value, {
          shouldValidate: true,
        });
      }
    },
    [setValue],
  );

  const onSubmit: SubmitHandler<UserFormData> = async (data) => {
    try {
      // Convert form data to backend format
      const backendData: UserSetObj = {
        ...data,
        birth_date: data.birth_date ? new Date(data.birth_date) : undefined,
      };

      const createdUser = await createUser(backendData);

      if (createdUser.success) {
        ToastNotify("success", "کاربر با موفقیت ایجاد شد");
        router.replace("/admin/users");
      } else {
        ToastNotify("error", createdUser.body?.message || "خطا در ایجاد کاربر");
      }
    } catch {
      ToastNotify("error", "خطا در ارسال فرم");
    }
  };

  return (
    <div className="p-8 mb-42">
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
            errMsg={errors.first_name?.message}
            className="w-1/2 p-4"
          />
          <MyInput
            label="نام خانوادگی"
            register={register}
            name="last_name"
            errMsg={errors.last_name?.message}
            className="w-1/2 p-4"
          />
          <MyInput
            label="نام پدر"
            register={register}
            name="father_name"
            errMsg={errors.father_name?.message}
            className="w-1/2 p-4"
          />
          <MyInput
            label="شماره موبایل"
            register={register}
            name="mobile"
            type="text"
            errMsg={errors.mobile?.message}
            className="w-1/2 p-4"
            placeholder="مثال: 9123456789"
          />
          <MyInput
            label="کد ملی"
            register={register}
            name="national_number"
            type="text"
            errMsg={errors.national_number?.message}
            className="w-1/2 p-4"
            placeholder="مثال: 1234567890"
          />
          <MyInput
            label="آدرس"
            register={register}
            name="address"
            errMsg={errors.address?.message}
            className="w-1/2 p-4"
          />
          <MyInput
            label="توضیحات"
            register={register}
            name="summary"
            errMsg={errors.summary?.message}
            className="w-1/2 p-4"
            type="textarea"
          />

          <MyDateInput
            label="تاریخ تولد"
            name="birth_date"
            control={control}
            errMsg={errors.birth_date?.message}
            className="w-1/2 p-4"
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
          />
          <SelectBox
            label="سطح دسترسی"
            name="level"
            setValue={setValue}
            errMsg={errors.level?.message}
            options={[
              { value: "Manager", label: "مدیر" },
              { value: "Editor", label: "ویرایشگر" },
              { value: "Ordinary", label: "عادی" },
              { value: "Ghost", label: "مخفی" },
            ]}
          />
          <SelectBox
            label="وضعیت تایید"
            name="is_verified"
            setValue={(fieldName, value) => {
              setValue("is_verified", value === "true");
            }}
            errMsg={errors.is_verified?.message}
            options={[
              { value: "false", label: "تایید نشده" },
              { value: "true", label: "تایید شده" },
            ]}
            defaultValue={{ value: "false", label: "تایید نشده" }}
          />
        </div>

        <hr className="my-4" />
        {/* City Selection */}
        <div className="flex flex-col gap-2">
          <h4 className="text-lg font-semibold text-gray-700 mb-2">
            تنظیمات کاربری
          </h4>
          <label className="text-sm font-medium text-slate-700 text-right">
            انتخاب شهر تحت مدیریت کاربر
          </label>
          <AsyncSelect
            cacheOptions
            defaultOptions
            value={selectedCity}
            loadOptions={loadCitiesOptions}
            onChange={(newValue) =>
              handleCitySelect(newValue as SelectOption | null)
            }
            placeholder="شهر را انتخاب کنید"
            noOptionsMessage={() => "شهری یافت نشد"}
            loadingMessage={() => "در حال بارگذاری..."}
            isRtl={true}
            isClearable
            styles={{
              control: (provided: any, state: any) => ({
                ...provided,
                minHeight: "48px",
                backgroundColor: errors.citySettingId ? "#fef2f2" : "white",
                borderColor: errors.citySettingId
                  ? state.isFocused
                    ? "#ef4444"
                    : "#fca5a5"
                  : state.isFocused
                    ? "#3b82f6"
                    : "#cbd5e1",
                borderRadius: "12px",
                direction: "rtl",
              }),
              valueContainer: (provided: any) => ({
                ...provided,
                padding: "2px 16px",
                direction: "rtl",
              }),
              placeholder: (provided: any) => ({
                ...provided,
                color: "#94a3b8",
                direction: "rtl",
                textAlign: "right",
              }),
              singleValue: (provided: any) => ({
                ...provided,
                color: "#1e293b",
                direction: "rtl",
                textAlign: "right",
              }),
              option: (provided: any, state: any) => ({
                ...provided,
                backgroundColor: state.isSelected
                  ? "#3b82f6"
                  : state.isFocused
                    ? "#f1f5f9"
                    : "transparent",
                color: state.isSelected ? "white" : "#1e293b",
                direction: "rtl",
                textAlign: "right",
              }),
            }}
          />
          {errors.citySettingId && (
            <span className="text-red-500 text-xs font-medium text-right mt-1">
              {errors.citySettingId.message}
            </span>
          )}
        </div>

        <div className="w-full flex gap-4 justify-end">
          {!isValid && Object.keys(errors).length > 0 && (
            <div className="text-sm text-red-600 mr-4 self-center">
              لطفاً فیلدهای اجباری را تکمیل کنید
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="p-4 px-8 bg-blue-600 text-white text-center font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isSubmitting ? "در حال ارسال..." : "ارسال"}
          </button>
        </div>
      </form>
    </div>
  );
};
