import React from "react";
import { UserFormData } from "./FormCreateUser";
import MyInput from "../atoms/MyInput";
import MyDateInput from "../atoms/MyDateInput";
import SelectBox from "../atoms/Select";
import { UploadImage } from "@/components/molecules/UploadFile";
import { Control, FieldValues, UseFormRegister, UseFormSetValue } from "react-hook-form";

interface MainFormStepProps<T extends FieldValues = FieldValues> {
  setFormData: React.Dispatch<React.SetStateAction<UserFormData>>;
  register: UseFormRegister<T>;
  setValue: UseFormSetValue<T>;
  control: Control<T>;
}

const MainFormStep: React.FC<MainFormStepProps> = ({ setFormData, register, setValue, control }) => {
  const handleAvatarUpload = (uploaded: string) => {
    setFormData((prev) => ({ ...prev, avatar: uploaded }));
  };

  const handleNationalCardUpload = (uploaded: string) => {
    setFormData((prev) => ({ ...prev, nationalCard: uploaded }));
  };

  return (
    <div className="space-y-4">
      <div className="w-full flex flex-wrap">
        <div className="w-1/2 p-2">
          <span className="text-sm font-medium text-gray-700">عکس پروفایل</span>
          <UploadImage inputName="avatar" setUploadedImage={handleAvatarUpload} type="image" />
        </div>
        <div className="w-1/2 p-2">
          <span className="text-sm font-medium text-gray-700">عکس کارت ملی</span>
          <UploadImage
            inputName="nationalCard"
            setUploadedImage={handleNationalCardUpload}
            type="image"
          />
        </div>

        <MyInput
          label="نام"
          name="first_name"
          register={register}
          errMsg={undefined}
          className="w-1/2 p-2"
        />
        <MyInput
          label="نام خانوادگی"
          name="last_name"
          register={register}
          errMsg={undefined}
          className="w-1/2 p-2"
        />
        <MyInput
          label="نام پدر"
          name="father_name"
          register={register}
          errMsg={undefined}
          className="w-1/2 p-2"
        />
        <MyInput
          label="شماره موبایل"
          name="mobile"
          register={register}
          errMsg={undefined}
          className="w-1/2 p-2"
          placeholder="مثال: 9123456789"
        />
        <MyInput
          label="کد ملی"
          name="national_number"
          register={register}
          errMsg={undefined}
          className="w-1/2 p-2"
          placeholder="مثال: 1234567890"
        />
        <MyInput
          label="آدرس"
          name="address"
          register={register}
          errMsg={undefined}
          className="w-1/2 p-2"
        />
        <MyInput
          label="توضیحات"
          name="summary"
          register={register}
          errMsg={undefined}
          className="w-1/2 p-2"
          type="textarea"
        />

        <MyDateInput
          label="تاریخ تولد"
          name="birth_date"
          control={control}
          errMsg={undefined}
          className="w-1/2 p-2"
          placeholder="انتخاب تاریخ تولد"
        />

        <SelectBox
          label="جنسیت"
          name="gender"
          errMsg={undefined}
          setValue={setValue}
          options={[
            { value: "Male", label: "مرد" },
            { value: "Female", label: "زن" },
          ]}
          className="w-1/2 p-2"
        />
        <SelectBox
          label="سطح دسترسی"
          name="level"
          errMsg={undefined}
          setValue={setValue}
          options={[
            { value: "Manager", label: "مدیر" },
            { value: "Editor", label: "ویرایشگر" },
            { value: "Ordinary", label: "عادی" },
            { value: "Ghost", label: "مخفی" },
            { value: "Enterprise", label: "سازمانی" },
          ]}
          className="w-1/2 p-2"
        />
        <SelectBox
          label="وضعیت تایید"
          name="is_verified"
          errMsg={undefined}
          setValue={setValue}
          options={[
            { value: "false", label: "تایید نشده" },
            { value: "true", label: "تایید شده" },
          ]}
          className="w-1/2 p-2"
        />
      </div>
    </div>
  );
};

export default MainFormStep;
