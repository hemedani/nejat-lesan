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
import { useCallback, useState, useMemo, useEffect } from "react";
import { gets as getCitiesAction } from "@/app/actions/city/gets";
import { gets as getProvincesAction } from "@/app/actions/province/gets";
import type { StylesConfig } from "react-select";
import CustomCheckbox from "../atoms/CustomCheckbox";
import {
  ALL_ANALYTIC_FILTERS,
  comprehensiveFilterFields,
  eventFilterFields,
} from "@/utils/filterConstants";
import MultiStepForm from "./MultiStepForm";

const AsyncSelect = dynamic(() => import("react-select/async"), { ssr: false });

export const UserCreateSchema = z
  .object({
    first_name: z.string().min(1, "نام الزامی است"),
    last_name: z.string().min(1, "نام خانوادگی الزامی است"),
    father_name: z.string().min(1, "نام پدر الزامی است"),
    mobile: z.string().regex(/^[0-9]{10}$/, "شماره تماس باید 10 رقم باشد"),
    gender: z.enum(["Male", "Female"], { message: "جنسیت الزامی است" }),
    birth_date: z.string().optional(),
    summary: z.string().optional(),
    national_number: z.string().regex(/^[0-9]{10}$/, "کد ملی باید 10 رقم باشد"),
    address: z.string().min(1, "آدرس الزامی است"),
    level: z.enum(["Ghost", "Manager", "Editor", "Enterprise"], {
      message: "سطح الزامی است",
    }),
    is_verified: z.boolean(),
    nationalCard: z.string().optional(),
    avatar: z.string().optional(),
    citySettingIds: z.array(z.string()).optional(),
    provinceSettingIds: z.array(z.string()).optional(),
    availableCharts: z
      .object({
        accidentSeverityAnalytics: ALL_ANALYTIC_FILTERS.accidentSeverityAnalyticFilters.optional(),
        areaUsageAnalytics: ALL_ANALYTIC_FILTERS.areaUsageAnalyticFilters.optional(),
        collisionAnalytics: ALL_ANALYTIC_FILTERS.collisionAnalyticFilters.optional(),
        companyPerformanceAnalytics: ALL_ANALYTIC_FILTERS.companyPerformanceAnalyticFilters.optional(),
        eventCollisionAnalytics: ALL_ANALYTIC_FILTERS.eventCollisionAnalyticFilters.optional(),
        eventSeverityAnalytics: ALL_ANALYTIC_FILTERS.eventSeverityAnalyticFilters.optional(),
        hourlyDayOfWeekAnalytics: ALL_ANALYTIC_FILTERS.hourlyDayOfWeekAnalyticFilters.optional(),
        humanReasonAnalytics: ALL_ANALYTIC_FILTERS.humanReasonAnalyticFilters.optional(),
        monthlyHolidayAnalytics: ALL_ANALYTIC_FILTERS.monthlyHolidayAnalyticFilters.optional(),
        roadDefectsAnalytics: ALL_ANALYTIC_FILTERS.roadDefectsAnalyticFilters.optional(),
        spatialCollisionAnalytics: ALL_ANALYTIC_FILTERS.spatialCollisionAnalyticFilters.optional(),
        spatialLightAnalytics: ALL_ANALYTIC_FILTERS.spatialLightAnalyticFilters.optional(),
        spatialSafetyIndexAnalytics: ALL_ANALYTIC_FILTERS.spatialSafetyIndexAnalyticFilters.optional(),
        spatialSeverityAnalytics: ALL_ANALYTIC_FILTERS.spatialSeverityAnalyticFilters.optional(),
        spatialSingleVehicleAnalytics:
          ALL_ANALYTIC_FILTERS.spatialSingleVehicleAnalyticFilters.optional(),
        temporalCollisionAnalytics: ALL_ANALYTIC_FILTERS.temporalCollisionAnalyticFilters.optional(),
        temporalCountAnalytics: ALL_ANALYTIC_FILTERS.temporalCountAnalyticFilters.optional(),
        temporalDamageAnalytics: ALL_ANALYTIC_FILTERS.temporalDamageAnalyticFilters.optional(),
        temporalNightAnalytics: ALL_ANALYTIC_FILTERS.temporalNightAnalyticFilters.optional(),
        temporalSeverityAnalytics: ALL_ANALYTIC_FILTERS.temporalSeverityAnalyticFilters.optional(),
        temporalTotalReasonAnalytics:
          ALL_ANALYTIC_FILTERS.temporalTotalReasonAnalyticFilters.optional(),
        temporalUnlicensedDriversAnalytics:
          ALL_ANALYTIC_FILTERS.temporalUnlicensedDriversAnalyticFilters.optional(),
        totalReasonAnalytics: ALL_ANALYTIC_FILTERS.totalReasonAnalyticFilters.optional(),
        vehicleReasonAnalytics: ALL_ANALYTIC_FILTERS.vehicleReasonAnalyticFilters.optional(),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    // Apply conditional validation for Enterprise users
    if (data.level === "Enterprise") {
      // Check if both citySettingIds and provinceSettingIds are provided
      if (
        data.citySettingIds &&
        data.citySettingIds.length > 0 &&
        data.provinceSettingIds &&
        data.provinceSettingIds.length > 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["citySettingIds"],
          message: "برای کاربران سازمانی فقط یکی از شهر یا استان قابل انتخاب است، نه هر دو",
        });
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["provinceSettingIds"],
          message: "برای کاربران سازمانی فقط یکی از شهر یا استان قابل انتخاب است، نه هر دو",
        });
      }
    }
  });

export type UserFormData = z.infer<typeof UserCreateSchema>;
export type UserSetObj = ReqType["main"]["user"]["addUser"]["set"];

export const FormCreateUser = ({ token }: { token?: string }) => {
  const router = useRouter();
  const [selectedCities, setSelectedCities] = useState<SelectOption[]>([]);
  const [selectedProvinces, setSelectedProvinces] = useState<SelectOption[]>([]);

  const {
    register,
    setValue,
    control,
    watch,
    formState: { errors, isSubmitting },
    getValues,
    trigger,
  } = useForm<UserFormData>({
    resolver: zodResolver(UserCreateSchema),
    defaultValues: {
      is_verified: false,
      summary: "",
      birth_date: "",
      nationalCard: "",
      avatar: "",
      level: "Editor", // Default to Editor level
      availableCharts: {},
    },
    mode: "onChange",
  });

  // Watch the level field to conditionally show chart settings
  const watchedLevel = watch("level");

  // Reset city and province selections when user level changes from Enterprise to another level
  useEffect(() => {
    if (watchedLevel !== "Enterprise") {
      setSelectedCities([]);
      setSelectedProvinces([]);
      setValue("citySettingIds", []);
      setValue("provinceSettingIds", []);
    }
  }, [watchedLevel, setSelectedCities, setSelectedProvinces, setValue]);

  // Load cities options
  const loadCitiesOptions = useCallback(async (inputValue?: string): Promise<SelectOption[]> => {
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
  }, []);

  // Load provinces options
  const loadProvincesOptions = useCallback(async (inputValue?: string): Promise<SelectOption[]> => {
    const setParams: { limit: number; page: number; name?: string } = {
      limit: 20,
      page: 1,
    };
    if (inputValue) {
      setParams.name = inputValue;
    }
    try {
      const response = await getProvincesAction({
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
      console.error("Error loading provinces:", error);
    }
    return [];
  }, []);

  // Handle city selection
  const handleCitySelect = useCallback(
    (selectedOptions: unknown) => {
      const options = (selectedOptions as SelectOption[]) || [];
      setSelectedCities(options);
      // Extract the IDs from the selected options
      const cityIds = options.map((option) => option.value);
      setValue("citySettingIds", cityIds, {
        shouldValidate: true,
      });

      // Clear province selection when city is selected
      if (cityIds.length > 0) {
        setSelectedProvinces([]);
        setValue("provinceSettingIds", [], {
          shouldValidate: true,
        });
      }
    },
    [setValue, setSelectedProvinces],
  );

  // Handle province selection
  const handleProvinceSelect = useCallback(
    (selectedOptions: unknown) => {
      const options = (selectedOptions as SelectOption[]) || [];
      setSelectedProvinces(options);
      // Extract the IDs from the selected options
      const provinceIds = options.map((option) => option.value);
      setValue("provinceSettingIds", provinceIds, {
        shouldValidate: true,
      });

      // Clear city selection when province is selected
      if (provinceIds.length > 0) {
        setSelectedCities([]);
        setValue("citySettingIds", [], {
          shouldValidate: true,
        });
      }
    },
    [setValue, setSelectedCities],
  );

  // Helper function to remove empty values and false checkboxes from objects
  const cleanObject = (obj: Record<string, unknown>): Record<string, unknown> => {
    const cleaned: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        continue;
      }

      // Skip empty strings and false boolean values
      if (
        (typeof value === "string" && value.trim() === "") ||
        (typeof value === "boolean" && value === false)
      ) {
        continue;
      }

      // If value is an object, recursively clean it
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        const cleanedNested = cleanObject(value as Record<string, unknown>);
        // Only add the nested object if it has properties
        if (Object.keys(cleanedNested).length > 0) {
          cleaned[key] = cleanedNested;
        }
      } else {
        // For arrays or primitive values, add them directly
        cleaned[key] = value;
      }
    }

    return cleaned;
  };

  const onSubmit: SubmitHandler<UserFormData> = async (data) => {
    try {
      // Create a copy of the data to manipulate
      const backendData = { ...data } as ReqType["main"]["user"]["addUser"]["set"];

      // Remove empty strings for avatar and nationalCard
      if (!data.avatar || data.avatar.trim() === "") {
        delete backendData.avatar;
      }
      if (!data.nationalCard || data.nationalCard.trim() === "") {
        delete backendData.nationalCard;
      }

      // Convert birth_date to Date object if present
      if (data.birth_date) {
        backendData.birth_date = new Date(data.birth_date);
      } else {
        delete backendData.birth_date;
      }

      // Handle citySettingIds - only include if there are selected cities
      if (!data.citySettingIds || data.citySettingIds.length === 0) {
        delete backendData.citySettingIds;
      }

      // Handle provinceSettingIds - only include if there are selected provinces
      if (!data.provinceSettingIds || data.provinceSettingIds.length === 0) {
        delete backendData.provinceSettingIds;
      }

      // Clean availableCharts if level is Enterprise
      if (data.level === "Enterprise" && data.availableCharts) {
        const cleanedCharts = cleanObject(data.availableCharts);
        if (Object.keys(cleanedCharts).length > 0) {
          backendData.availableCharts = cleanedCharts;
        } else {
          delete backendData.availableCharts;
        }
      } else {
        delete backendData.availableCharts;
      }

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

  // Memoized select styles for better performance
  const selectStyles = useMemo<StylesConfig<unknown, false>>(
    () => ({
      control: (provided, state) => ({
        ...provided,
        minHeight: "48px",
        backgroundColor: errors.citySettingIds ? "#fef2f2" : "white",
        borderColor: errors.citySettingIds
          ? state.isFocused
            ? "#ef4444"
            : "#fca5a5"
          : state.isFocused
            ? "#3b82f6"
            : "#cbd5e1",
        borderRadius: "12px",
        direction: "rtl",
        borderWidth: "1px",
        boxShadow: state.isFocused
          ? errors.citySettingIds
            ? "0 0 0 2px rgba(239, 68, 68, 0.1)"
            : "0 0 0 2px rgba(59, 130, 246, 0.1)"
          : "none",
        transition: "all 0.2s ease-in-out",
        cursor: "pointer",
      }),
      valueContainer: (provided) => ({
        ...provided,
        padding: "2px 16px",
        direction: "rtl",
      }),
      input: (provided) => ({
        ...provided,
        margin: "0",
        padding: "0",
        color: "#1e293b",
        direction: "rtl",
      }),
      placeholder: (provided) => ({
        ...provided,
        color: "#94a3b8",
        fontSize: "14px",
        direction: "rtl",
        textAlign: "right",
      }),
      singleValue: (provided) => ({
        ...provided,
        color: "#1e293b",
        direction: "rtl",
        textAlign: "right",
      }),
      multiValue: (provided) => ({
        ...provided,
        backgroundColor: "#e2e8f0",
        borderRadius: "8px",
        margin: "2px",
        direction: "rtl",
      }),
      multiValueLabel: (provided) => ({
        ...provided,
        color: "#475569",
        fontSize: "13px",
        fontWeight: "500",
        padding: "4px 8px",
        direction: "rtl",
      }),
      multiValueRemove: (provided) => ({
        ...provided,
        color: "#64748b",
        borderRadius: "0 8px 8px 0",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          backgroundColor: "#ef4444",
          color: "white",
        },
      }),
      indicatorSeparator: () => ({
        display: "none",
      }),
      dropdownIndicator: (provided, state) => ({
        ...provided,
        color: "#64748b",
        padding: "8px 12px",
        transform: state.selectProps.menuIsOpen ? "rotate(180deg)" : "rotate(0deg)",
        transition: "all 0.2s ease-in-out",
      }),
      clearIndicator: (provided) => ({
        ...provided,
        color: "#64748b",
        padding: "8px",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
      }),
      menu: (provided) => ({
        ...provided,
        backgroundColor: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        marginTop: "4px",
        overflow: "hidden",
        zIndex: 9999,
      }),
      menuList: (provided) => ({
        ...provided,
        padding: "8px",
        maxHeight: "200px",
      }),
      option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected ? "#3b82f6" : state.isFocused ? "#f1f5f9" : "transparent",
        color: state.isSelected ? "white" : "#1e293b",
        borderRadius: "8px",
        margin: "2px 0",
        padding: "12px 16px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: state.isSelected ? "500" : "400",
        direction: "rtl",
        textAlign: "right",
        transition: "all 0.15s ease-in-out",
        "&:hover": {
          backgroundColor: state.isSelected ? "#2563eb" : "#f1f5f9",
        },
      }),
      noOptionsMessage: (provided) => ({
        ...provided,
        color: "#64748b",
        fontSize: "14px",
        padding: "12px 16px",
        direction: "rtl",
        textAlign: "right",
      }),
      loadingMessage: (provided) => ({
        ...provided,
        color: "#64748b",
        fontSize: "14px",
        padding: "12px 16px",
        direction: "rtl",
        textAlign: "right",
      }),
    }),
    [errors],
  );

  // Define steps based on user level
  const basicInfoStep = {
    id: "basic-info",
    title: "اطلاعات پایه کاربر",
    component: (
      <div className="space-y-4">
        <div className="w-full flex flex-wrap">
          <div className="w-1/2 p-2">
            <span className="text-sm font-medium text-gray-700">عکس پروفایل</span>
            <UploadImage
              inputName="avatar"
              setUploadedImage={(uploaded: string) => setValue("avatar", uploaded)}
              type="image"
              token={token}
            />
          </div>
          <div className="w-1/2 p-2">
            <span className="text-sm font-medium text-gray-700">عکس کارت ملی</span>
            <UploadImage
              inputName="nationalCard"
              setUploadedImage={(uploaded: string) => setValue("nationalCard", uploaded)}
              type="image"
              token={token}
            />
          </div>

          <MyInput
            label="نام"
            register={register}
            name="first_name"
            errMsg={errors.first_name?.message}
            className="w-1/2 p-2"
          />
          <MyInput
            label="نام خانوادگی"
            register={register}
            name="last_name"
            errMsg={errors.last_name?.message}
            className="w-1/2 p-2"
          />
          <MyInput
            label="نام پدر"
            register={register}
            name="father_name"
            errMsg={errors.father_name?.message}
            className="w-1/2 p-2"
          />
          <MyInput
            label="شماره موبایل"
            register={register}
            name="mobile"
            type="text"
            errMsg={errors.mobile?.message}
            className="w-1/2 p-2"
            placeholder="مثال: 9123456789"
          />
          <MyInput
            label="کد ملی"
            register={register}
            name="national_number"
            type="text"
            errMsg={errors.national_number?.message}
            className="w-1/2 p-2"
            placeholder="مثال: 1234567890"
          />
          <MyInput
            label="آدرس"
            register={register}
            name="address"
            errMsg={errors.address?.message}
            className="w-1/2 p-2"
          />
          <MyInput
            label="توضیحات"
            register={register}
            name="summary"
            errMsg={errors.summary?.message}
            className="w-1/2 p-2"
            type="textarea"
          />

          <MyDateInput
            label="تاریخ تولد"
            name="birth_date"
            control={control}
            errMsg={errors.birth_date?.message}
            className="w-1/2 p-2"
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
            className="w-1/2 p-2"
          />
          <SelectBox
            label="سطح دسترسی"
            name="level"
            setValue={setValue}
            errMsg={errors.level?.message}
            options={[
              { value: "Manager", label: "مدیر" },
              { value: "Editor", label: "ویرایشگر" },
              { value: "Enterprise", label: "سازمانی" },
            ]}
            className="w-1/2 p-2"
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
            className="w-1/2 p-2"
          />
        </div>
      </div>
    ),
  };

  const citySettingsStep = {
    id: "city-settings",
    title: "تنظیمات شهر",
    component: (
      <div className="flex flex-col gap-2">
        <h4 className="text-lg font-semibold text-gray-700 mb-2">تنظیات کاربری</h4>

        <div>
          <label className="text-sm font-medium text-slate-700 text-right block mb-2">
            انتخاب استان‌های تحت مدیریت کاربر
          </label>
          <AsyncSelect
            cacheOptions
            defaultOptions
            value={selectedProvinces}
            loadOptions={loadProvincesOptions}
            onChange={handleProvinceSelect}
            placeholder="استان‌ها را انتخاب کنید"
            noOptionsMessage={() => "استانی یافت نشد"}
            loadingMessage={() => "در حال بارگذاری..."}
            isRtl={true}
            isMulti
            styles={selectStyles}
          />
          {errors.provinceSettingIds && (
            <span className="text-red-500 text-xs font-medium text-right mt-1">
              {errors.provinceSettingIds.message}
            </span>
          )}
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium text-slate-700 text-right block mb-2">
            انتخاب شهرهای تحت مدیریت کاربر
          </label>
          <AsyncSelect
            cacheOptions
            defaultOptions
            value={selectedCities}
            loadOptions={loadCitiesOptions}
            onChange={handleCitySelect}
            placeholder="شهرها را انتخاب کنید"
            noOptionsMessage={() => "شهری یافت نشد"}
            loadingMessage={() => "در حال بارگذاری..."}
            isRtl={true}
            isMulti
            styles={selectStyles}
          />
          {errors.citySettingIds && (
            <span className="text-red-500 text-xs font-medium text-right mt-1">
              {errors.citySettingIds.message}
            </span>
          )}
        </div>
      </div>
    ),
  };

  // Conditionally build steps based on user level
  const getSteps = () => {
    const baseSteps = [basicInfoStep];

    // // Add city settings step only for Enterprise users
    // if (watchedLevel === "Enterprise") {
    //   baseSteps.push(citySettingsStep);
    // }

    // Add analytics steps only for Enterprise users
    if (watchedLevel === "Enterprise") {
      baseSteps.push(
        citySettingsStep,
        {
          id: "accident-severity-analytics",
          title: "تحلیل‌های شدت تصادف",
          component: (
            <div className="border rounded p-3">
              <h5 className="font-medium mb-2">تحلیل‌های شدت تصادف</h5>
              <div className="space-y-2">
                {comprehensiveFilterFields.map((field) => (
                  <CustomCheckbox
                    key={`accident-severity-${field.key}`}
                    checked={
                      !!watch(
                        `availableCharts.accidentSeverityAnalytics.${field.key}` as keyof UserFormData,
                      )
                    }
                    onChange={(checked) =>
                      setValue(
                        `availableCharts.accidentSeverityAnalytics.${field.key}` as keyof UserFormData,
                        checked,
                      )
                    }
                    label={field.label}
                  />
                ))}
              </div>
            </div>
          ),
        },
        {
          id: "area-usage-analytics",
          title: "تحلیل‌های استفاده از منطقه",
          component: (
            <div className="border rounded p-3">
              <h5 className="font-medium mb-2">تحلیل‌های استفاده از منطقه</h5>
              <div className="space-y-2">
                {comprehensiveFilterFields.map((field) => (
                  <CustomCheckbox
                    key={`area-usage-${field.key}`}
                    checked={
                      !!watch(`availableCharts.areaUsageAnalytics.${field.key}` as keyof UserFormData)
                    }
                    onChange={(checked) =>
                      setValue(
                        `availableCharts.areaUsageAnalytics.${field.key}` as keyof UserFormData,
                        checked,
                      )
                    }
                    label={field.label}
                  />
                ))}
              </div>
            </div>
          ),
        },
        {
          id: "collision-analytics",
          title: "تحلیل‌های برخورد",
          component: (
            <div className="border rounded p-3">
              <h5 className="font-medium mb-2">تحلیل‌های برخورد</h5>
              <div className="space-y-2">
                {comprehensiveFilterFields.map((field) => (
                  <CustomCheckbox
                    key={`collision-${field.key}`}
                    checked={
                      !!watch(`availableCharts.collisionAnalytics.${field.key}` as keyof UserFormData)
                    }
                    onChange={(checked) =>
                      setValue(
                        `availableCharts.collisionAnalytics.${field.key}` as keyof UserFormData,
                        checked,
                      )
                    }
                    label={field.label}
                  />
                ))}
              </div>
            </div>
          ),
        },
        {
          id: "company-performance-analytics",
          title: "تحلیل‌های عملکرد شرکت",
          component: (
            <div className="border rounded p-3">
              <h5 className="font-medium mb-2">تحلیل‌های عملکرد شرکت</h5>
              <div className="space-y-2">
                {comprehensiveFilterFields.map((field) => (
                  <CustomCheckbox
                    key={`company-performance-${field.key}`}
                    checked={
                      !!watch(
                        `availableCharts.companyPerformanceAnalytics.${field.key}` as keyof UserFormData,
                      )
                    }
                    onChange={(checked) =>
                      setValue(
                        `availableCharts.companyPerformanceAnalytics.${field.key}` as keyof UserFormData,
                        checked,
                      )
                    }
                    label={field.label}
                  />
                ))}
              </div>
            </div>
          ),
        },
        {
          id: "hourly-day-of-week-analytics",
          title: "تحلیل‌های زمانی",
          component: (
            <div className="border rounded p-3">
              <h5 className="font-medium mb-2">تحلیل‌های زمانی</h5>
              <div className="space-y-2">
                {comprehensiveFilterFields.map((field) => (
                  <CustomCheckbox
                    key={`hourly-day-of-week-${field.key}`}
                    checked={
                      !!watch(
                        `availableCharts.hourlyDayOfWeekAnalytics.${field.key}` as keyof UserFormData,
                      )
                    }
                    onChange={(checked) =>
                      setValue(
                        `availableCharts.hourlyDayOfWeekAnalytics.${field.key}` as keyof UserFormData,
                        checked,
                      )
                    }
                    label={field.label}
                  />
                ))}
              </div>
            </div>
          ),
        },
        {
          id: "human-reason-analytics",
          title: "تحلیل‌های دلیل انسانی",
          component: (
            <div className="border rounded p-3">
              <h5 className="font-medium mb-2">تحلیل‌های دلیل انسانی</h5>
              <div className="space-y-2">
                {comprehensiveFilterFields.map((field) => (
                  <CustomCheckbox
                    key={`human-reason-${field.key}`}
                    checked={
                      !!watch(
                        `availableCharts.humanReasonAnalytics.${field.key}` as keyof UserFormData,
                      )
                    }
                    onChange={(checked) =>
                      setValue(
                        `availableCharts.humanReasonAnalytics.${field.key}` as keyof UserFormData,
                        checked,
                      )
                    }
                    label={field.label}
                  />
                ))}
              </div>
            </div>
          ),
        },
        {
          id: "event-collision-analytics",
          title: "تحلیل‌های تصادف رویداد",
          component: (
            <div className="border rounded p-3">
              <h5 className="font-medium mb-2">تحلیل‌های تصادف رویداد</h5>
              <div className="space-y-2">
                {eventFilterFields.map((field) => (
                  <CustomCheckbox
                    key={`event-collision-${field.key}`}
                    checked={
                      !!watch(
                        `availableCharts.eventCollisionAnalytics.${field.key}` as keyof UserFormData,
                      )
                    }
                    onChange={(checked) =>
                      setValue(
                        `availableCharts.eventCollisionAnalytics.${field.key}` as keyof UserFormData,
                        checked,
                      )
                    }
                    label={field.label}
                  />
                ))}
              </div>
            </div>
          ),
        },
        {
          id: "event-severity-analytics",
          title: "تحلیل‌های شدت رویداد",
          component: (
            <div className="border rounded p-3">
              <h5 className="font-medium mb-2">تحلیل‌های شدت رویداد</h5>
              <div className="space-y-2">
                {eventFilterFields.map((field) => (
                  <CustomCheckbox
                    key={`event-severity-${field.key}`}
                    checked={
                      !!watch(
                        `availableCharts.eventSeverityAnalytics.${field.key}` as keyof UserFormData,
                      )
                    }
                    onChange={(checked) =>
                      setValue(
                        `availableCharts.eventSeverityAnalytics.${field.key}` as keyof UserFormData,
                        checked,
                      )
                    }
                    label={field.label}
                  />
                ))}
              </div>
            </div>
          ),
        },
        {
          id: "monthly-holiday-analytics",
          title: "تحلیل‌های تعطیلات ماهانه",
          component: (
            <div className="border rounded p-3">
              <h5 className="font-medium mb-2">تحلیل‌های تعطیلات ماهانه</h5>
              <div className="space-y-2">
                {comprehensiveFilterFields.map((field) => (
                  <CustomCheckbox
                    key={`monthly-holiday-${field.key}`}
                    checked={
                      !!watch(
                        `availableCharts.monthlyHolidayAnalytics.${field.key}` as keyof UserFormData,
                      )
                    }
                    onChange={(checked) =>
                      setValue(
                        `availableCharts.monthlyHolidayAnalytics.${field.key}` as keyof UserFormData,
                        checked,
                      )
                    }
                    label={field.label}
                  />
                ))}
              </div>
            </div>
          ),
        },
        {
          id: "road-defects-analytics",
          title: "تحلیل‌های نقص جاده",
          component: (
            <div className="border rounded p-3">
              <h5 className="font-medium mb-2">تحلیل‌های نقص جاده</h5>
              <div className="space-y-2">
                {comprehensiveFilterFields.map((field) => (
                  <CustomCheckbox
                    key={`road-defects-${field.key}`}
                    checked={
                      !!watch(
                        `availableCharts.roadDefectsAnalytics.${field.key}` as keyof UserFormData,
                      )
                    }
                    onChange={(checked) =>
                      setValue(
                        `availableCharts.roadDefectsAnalytics.${field.key}` as keyof UserFormData,
                        checked,
                      )
                    }
                    label={field.label}
                  />
                ))}
              </div>
            </div>
          ),
        },
        {
          id: "spatial-collision-analytics",
          title: "تحلیل‌های مکانی - برخورد",
          component: (
            <div className="border rounded p-3">
              <h5 className="font-medium mb-2">تحلیل‌های مکانی - برخورد</h5>
              <div className="space-y-2">
                {comprehensiveFilterFields.map((field) => (
                  <CustomCheckbox
                    key={`spatial-collision-${field.key}`}
                    checked={
                      !!watch(
                        `availableCharts.spatialCollisionAnalytics.${field.key}` as keyof UserFormData,
                      )
                    }
                    onChange={(checked) =>
                      setValue(
                        `availableCharts.spatialCollisionAnalytics.${field.key}` as keyof UserFormData,
                        checked,
                      )
                    }
                    label={field.label}
                  />
                ))}
              </div>
            </div>
          ),
        },
        {
          id: "spatial-light-analytics",
          title: "تحلیل‌های مکانی - نور",
          component: (
            <div className="border rounded p-3">
              <h5 className="font-medium mb-2">تحلیل‌های مکانی - نور</h5>
              <div className="space-y-2">
                {comprehensiveFilterFields.map((field) => (
                  <CustomCheckbox
                    key={`spatial-light-${field.key}`}
                    checked={
                      !!watch(
                        `availableCharts.spatialLightAnalytics.${field.key}` as keyof UserFormData,
                      )
                    }
                    onChange={(checked) =>
                      setValue(
                        `availableCharts.spatialLightAnalytics.${field.key}` as keyof UserFormData,
                        checked,
                      )
                    }
                    label={field.label}
                  />
                ))}
              </div>
            </div>
          ),
        },
        {
          id: "spatial-safety-index-analytics",
          title: "تحلیل‌های مکانی - شاخص ایمنی",
          component: (
            <div className="border rounded p-3">
              <h5 className="font-medium mb-2">تحلیل‌های مکانی - شاخص ایمنی</h5>
              <div className="space-y-2">
                {/* Extra fields specific to spatial safety index analytics */}
                <CustomCheckbox
                  key="spatial-safety-index-groupBy"
                  checked={
                    !!watch(
                      `availableCharts.spatialSafetyIndexAnalytics.groupBy` as keyof UserFormData,
                    )
                  }
                  onChange={(checked) =>
                    setValue(
                      `availableCharts.spatialSafetyIndexAnalytics.groupBy` as keyof UserFormData,
                      checked,
                    )
                  }
                  label="گروه‌بندی بر اساس موقعیت مکانی"
                />
                {comprehensiveFilterFields.map((field) => (
                  <CustomCheckbox
                    key={`spatial-safety-index-${field.key}`}
                    checked={
                      !!watch(
                        `availableCharts.spatialSafetyIndexAnalytics.${field.key}` as keyof UserFormData,
                      )
                    }
                    onChange={(checked) =>
                      setValue(
                        `availableCharts.spatialSafetyIndexAnalytics.${field.key}` as keyof UserFormData,
                        checked,
                      )
                    }
                    label={field.label}
                  />
                ))}
              </div>
            </div>
          ),
        },
        {
          id: "spatial-severity-analytics",
          title: "تحلیل‌های مکانی - شدت",
          component: (
            <div className="border rounded p-3">
              <h5 className="font-medium mb-2">تحلیل‌های مکانی - شدت</h5>
              <div className="space-y-2">
                {comprehensiveFilterFields.map((field) => (
                  <CustomCheckbox
                    key={`spatial-severity-${field.key}`}
                    checked={
                      !!watch(
                        `availableCharts.spatialSeverityAnalytics.${field.key}` as keyof UserFormData,
                      )
                    }
                    onChange={(checked) =>
                      setValue(
                        `availableCharts.spatialSeverityAnalytics.${field.key}` as keyof UserFormData,
                        checked,
                      )
                    }
                    label={field.label}
                  />
                ))}
              </div>
            </div>
          ),
        },
        {
          id: "spatial-single-vehicle-analytics",
          title: "تحلیل‌های مکانی - تک وسیله",
          component: (
            <div className="border rounded p-3">
              <h5 className="font-medium mb-2">تحلیل‌های مکانی - تک وسیله</h5>
              <div className="space-y-2">
                {comprehensiveFilterFields.map((field) => (
                  <CustomCheckbox
                    key={`spatial-single-vehicle-${field.key}`}
                    checked={
                      !!watch(
                        `availableCharts.spatialSingleVehicleAnalytics.${field.key}` as keyof UserFormData,
                      )
                    }
                    onChange={(checked) =>
                      setValue(
                        `availableCharts.spatialSingleVehicleAnalytics.${field.key}` as keyof UserFormData,
                        checked,
                      )
                    }
                    label={field.label}
                  />
                ))}
              </div>
            </div>
          ),
        },
        {
          id: "temporal-collision-analytics",
          title: "تحلیل‌های زمانی - برخورد",
          component: (
            <div className="border rounded p-3">
              <h5 className="font-medium mb-2">تحلیل‌های زمانی - برخورد</h5>
              <div className="space-y-2">
                {comprehensiveFilterFields.map((field) => (
                  <CustomCheckbox
                    key={`temporal-collision-${field.key}`}
                    checked={
                      !!watch(
                        `availableCharts.temporalCollisionAnalytics.${field.key}` as keyof UserFormData,
                      )
                    }
                    onChange={(checked) =>
                      setValue(
                        `availableCharts.temporalCollisionAnalytics.${field.key}` as keyof UserFormData,
                        checked,
                      )
                    }
                    label={field.label}
                  />
                ))}
              </div>
            </div>
          ),
        },
        {
          id: "temporal-count-analytics",
          title: "تحلیل‌های زمانی - تعداد",
          component: (
            <div className="border rounded p-3">
              <h5 className="font-medium mb-2">تحلیل‌های زمانی - تعداد</h5>
              <div className="space-y-2">
                {comprehensiveFilterFields.map((field) => (
                  <CustomCheckbox
                    key={`temporal-count-${field.key}`}
                    checked={
                      !!watch(
                        `availableCharts.temporalCountAnalytics.${field.key}` as keyof UserFormData,
                      )
                    }
                    onChange={(checked) =>
                      setValue(
                        `availableCharts.temporalCountAnalytics.${field.key}` as keyof UserFormData,
                        checked,
                      )
                    }
                    label={field.label}
                  />
                ))}
              </div>
            </div>
          ),
        },
        {
          id: "temporal-damage-analytics",
          title: "تحلیل‌های زمانی - خسارت",
          component: (
            <div className="border rounded p-3">
              <h5 className="font-medium mb-2">تحلیل‌های زمانی - خسارت</h5>
              <div className="space-y-2">
                {comprehensiveFilterFields.map((field) => (
                  <CustomCheckbox
                    key={`temporal-damage-${field.key}`}
                    checked={
                      !!watch(
                        `availableCharts.temporalDamageAnalytics.${field.key}` as keyof UserFormData,
                      )
                    }
                    onChange={(checked) =>
                      setValue(
                        `availableCharts.temporalDamageAnalytics.${field.key}` as keyof UserFormData,
                        checked,
                      )
                    }
                    label={field.label}
                  />
                ))}
              </div>
            </div>
          ),
        },
        {
          id: "temporal-night-analytics",
          title: "تحلیل‌های زمانی - شب",
          component: (
            <div className="border rounded p-3">
              <h5 className="font-medium mb-2">تحلیل‌های زمانی - شب</h5>
              <div className="space-y-2">
                {comprehensiveFilterFields.map((field) => (
                  <CustomCheckbox
                    key={`temporal-night-${field.key}`}
                    checked={
                      !!watch(
                        `availableCharts.temporalNightAnalytics.${field.key}` as keyof UserFormData,
                      )
                    }
                    onChange={(checked) =>
                      setValue(
                        `availableCharts.temporalNightAnalytics.${field.key}` as keyof UserFormData,
                        checked,
                      )
                    }
                    label={field.label}
                  />
                ))}
              </div>
            </div>
          ),
        },
        {
          id: "temporal-severity-analytics",
          title: "تحلیل‌های زمانی - شدت",
          component: (
            <div className="border rounded p-3">
              <h5 className="font-medium mb-2">تحلیل‌های زمانی - شدت</h5>
              <div className="space-y-2">
                {comprehensiveFilterFields.map((field) => (
                  <CustomCheckbox
                    key={`temporal-severity-${field.key}`}
                    checked={
                      !!watch(
                        `availableCharts.temporalSeverityAnalytics.${field.key}` as keyof UserFormData,
                      )
                    }
                    onChange={(checked) =>
                      setValue(
                        `availableCharts.temporalSeverityAnalytics.${field.key}` as keyof UserFormData,
                        checked,
                      )
                    }
                    label={field.label}
                  />
                ))}
              </div>
            </div>
          ),
        },
        {
          id: "temporal-total-reason-analytics",
          title: "تحلیل‌های زمانی - دلیل کل",
          component: (
            <div className="border rounded p-3">
              <h5 className="font-medium mb-2">تحلیل‌های زمانی - دلیل کل</h5>
              <div className="space-y-2">
                {comprehensiveFilterFields.map((field) => (
                  <CustomCheckbox
                    key={`temporal-total-reason-${field.key}`}
                    checked={
                      !!watch(
                        `availableCharts.temporalTotalReasonAnalytics.${field.key}` as keyof UserFormData,
                      )
                    }
                    onChange={(checked) =>
                      setValue(
                        `availableCharts.temporalTotalReasonAnalytics.${field.key}` as keyof UserFormData,
                        checked,
                      )
                    }
                    label={field.label}
                  />
                ))}
              </div>
            </div>
          ),
        },
        {
          id: "temporal-unlicensed-drivers-analytics",
          title: "تحلیل‌های زمانی - رانندگان فاقد گواهینامه",
          component: (
            <div className="border rounded p-3">
              <h5 className="font-medium mb-2">تحلیل‌های زمانی - رانندگان فاقد گواهینامه</h5>
              <div className="space-y-2">
                {comprehensiveFilterFields.map((field) => (
                  <CustomCheckbox
                    key={`temporal-unlicensed-drivers-${field.key}`}
                    checked={
                      !!watch(
                        `availableCharts.temporalUnlicensedDriversAnalytics.${field.key}` as keyof UserFormData,
                      )
                    }
                    onChange={(checked) =>
                      setValue(
                        `availableCharts.temporalUnlicensedDriversAnalytics.${field.key}` as keyof UserFormData,
                        checked,
                      )
                    }
                    label={field.label}
                  />
                ))}
              </div>
            </div>
          ),
        },
        {
          id: "total-reason-analytics",
          title: "تحلیل‌های دلیل کل",
          component: (
            <div className="border rounded p-3">
              <h5 className="font-medium mb-2">تحلیل‌های دلیل کل</h5>
              <div className="space-y-2">
                {comprehensiveFilterFields.map((field) => (
                  <CustomCheckbox
                    key={`total-reason-${field.key}`}
                    checked={
                      !!watch(
                        `availableCharts.totalReasonAnalytics.${field.key}` as keyof UserFormData,
                      )
                    }
                    onChange={(checked) =>
                      setValue(
                        `availableCharts.totalReasonAnalytics.${field.key}` as keyof UserFormData,
                        checked,
                      )
                    }
                    label={field.label}
                  />
                ))}
              </div>
            </div>
          ),
        },
        {
          id: "vehicle-reason-analytics",
          title: "تحلیل‌های دلیل وسیله نقلیه",
          component: (
            <div className="border rounded p-3">
              <h5 className="font-medium mb-2">تحلیل‌های دلیل وسیله نقلیه</h5>
              <div className="space-y-2">
                {comprehensiveFilterFields.map((field) => (
                  <CustomCheckbox
                    key={`vehicle-reason-${field.key}`}
                    checked={
                      !!watch(
                        `availableCharts.vehicleReasonAnalytics.${field.key}` as keyof UserFormData,
                      )
                    }
                    onChange={(checked) =>
                      setValue(
                        `availableCharts.vehicleReasonAnalytics.${field.key}` as keyof UserFormData,
                        checked,
                      )
                    }
                    label={field.label}
                  />
                ))}
              </div>
            </div>
          ),
        },
      );
    }

    return baseSteps;
  };

  // Always use multi-step form regardless of user level
  return (
    <div className="p-8 mb-42">
      <MultiStepForm
        steps={getSteps()}
        formData={getValues()}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        triggerValidation={trigger}
        isEnterprise={watchedLevel === "Enterprise"}
      />
    </div>
  );
};
