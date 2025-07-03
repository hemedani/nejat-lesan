"use client";

import React, { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import MyAsyncMultiSelect, { SelectOption } from "../atoms/MyAsyncMultiSelect";
import MyDateInput from "../atoms/MyDateInput";
import MyInput from "../atoms/MyInput";

// Import action functions for loading options
import { gets as getProvincesAction } from "@/app/actions/province/gets";
import { gets as getCitiesAction } from "@/app/actions/city/gets";
import { gets as getLightStatusesAction } from "@/app/actions/light_status/gets";
import { gets as getCollisionTypesAction } from "@/app/actions/collision_type/gets";
import { gets as getRoadDefectsAction } from "@/app/actions/road_defect/gets";
import { gets as getAirStatusesAction } from "@/app/actions/air_status/gets";
import { gets as getAreaUsagesAction } from "@/app/actions/area_usage/gets";
import { gets as getRoadSurfaceConditionsAction } from "@/app/actions/road_surface_condition/gets";
import { gets as getMaxDamageSectionsAction } from "@/app/actions/max_damage_section/gets";

// Configuration interface
interface ChartFilterConfig {
  disableSeverityFilter?: boolean;
  disableCollisionTypeFilter?: boolean;
  disableLightingFilter?: boolean;
  lockToSevereAccidents?: boolean;
}

// Comprehensive filter state interface for all chart pages
export interface RoadDefectsFilterState {
  // --- Core Accident Details ---
  seri?: number;
  serial?: number;
  dateOfAccidentFrom?: string;
  dateOfAccidentTo?: string;
  deadCountMin?: number;
  deadCountMax?: number;
  injuredCountMin?: number;
  injuredCountMax?: number;
  officer?: string;

  // --- Location & Context ---
  province?: string[];
  city?: string[];
  road?: string[];
  accidentType?: string[];
  lightStatus?: string[];
  collisionType?: string[];
  roadSituation?: string[];

  // --- Environmental & Reason-based ---
  areaUsages?: string[];
  roadDefects?: string[];
  humanReasons?: string[];
  vehicleReasons?: string[];
  roadSurfaceConditions?: string[];
  airStatuses?: string[];

  // --- Vehicle DTOs Filters ---
  vehicleSystem?: string[];
  vehicleFaultStatus?: string[];
  maxDamageSections?: string[];
  vehicleType?: string[];
  vehicleColor?: string[];
  vehicleInsuranceCo?: string[];
  vehicleBodyInsuranceCo?: string[];
  vehicleLicenceType?: string[];
  vehiclePlaqueType?: string[];
  vehiclePlaqueUsage?: string[];
  vehicleMotionDirection?: string[];
  vehicleEquipmentDamage?: string[];
  vehicleRoadRepairType?: string[];

  // --- Driver in Vehicle DTOs Filters ---
  driverSex?: string[];
  driverLicenceType?: string[];
  driverInjuryType?: string[];
  driverFaultStatus?: string[];
  driverAge?: string[];
  driverPosition?: string[];
  driverRulingType?: string[];

  // --- Road and Infrastructure ---
  roadType?: string[];
  roadWidth?: string[];
  roadSlope?: string[];
  roadCurve?: string[];
  roadSign?: string[];
  roadBarrier?: string[];
  roadLighting?: string[];
  roadShoulder?: string[];
  shoulderStatus?: string[];
  trafficZone?: string[];
  cityZone?: string[];

  // --- Time and Weather ---
  timeOfAccidentFrom?: string;
  timeOfAccidentTo?: string;
  seasonality?: string[];
  dayOfWeek?: string[];
  isHoliday?: boolean;
  weatherCondition?: string[];
  visibility?: string[];
  temperature?: string[];
  precipitation?: string[];
}

// Dynamic checkbox filter interface
export interface DynamicCheckboxFilter {
  title: string;
  options: string[];
  activeOptions: string[];
  onChange: (newActiveOptions: string[]) => void;
}

interface SidebarProps {
  config: ChartFilterConfig;
  onApplyFilters: (filters: RoadDefectsFilterState) => void;
  title?: string;
  description?: string;
  initialFilters?: Partial<RoadDefectsFilterState>;
  dynamicCheckboxFilter?: DynamicCheckboxFilter;
}

const ChartsFilterSidebar: React.FC<SidebarProps> = ({
  config,
  onApplyFilters,
  title = "فیلترهای تحلیل",
  description = "برای مشاهده تحلیل دقیق، فیلترهای مورد نظر را اعمال کنید",
  initialFilters,
  dynamicCheckboxFilter,
}) => {
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RoadDefectsFilterState>({
    defaultValues: initialFilters || {},
  });

  // Set initial values for maxDamageSections
  useEffect(() => {
    if (initialFilters?.maxDamageSections?.length) {
      setValue("maxDamageSections", initialFilters.maxDamageSections);
    }
  }, [initialFilters?.maxDamageSections, setValue]);

  // Set initial values for collisionType
  useEffect(() => {
    if (initialFilters?.collisionType?.length) {
      setValue("collisionType", initialFilters.collisionType);
    }
  }, [initialFilters?.collisionType, setValue]);

  // Helper function to create loadOptions for async multi-select
  const createLoadOptions =
    (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      action: (args: any) => Promise<any>,
    ) =>
    async (inputValue?: string): Promise<SelectOption[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const setParams: any = { limit: 20, page: 1 };
      if (inputValue) {
        setParams.name = inputValue;
      }
      try {
        const response = await action({
          set: setParams,
          get: { _id: 1, name: 1 },
        });
        if (response && response.success) {
          return response.body.map((item: { _id: string; name: string }) => ({
            value: item.name,
            label: item.name,
          }));
        }
      } catch (error) {
        console.error("Error loading options:", error);
      }
      return [];
    };

  // Load options functions
  const loadProvincesOptions = createLoadOptions(getProvincesAction);
  const loadCitiesOptions = createLoadOptions(getCitiesAction);
  const loadLightStatusesOptions = createLoadOptions(getLightStatusesAction);
  const loadCollisionTypesOptions = createLoadOptions(getCollisionTypesAction);
  const loadRoadDefectsOptions = createLoadOptions(getRoadDefectsAction);
  const loadAirStatusesOptions = createLoadOptions(getAirStatusesAction);
  const loadAreaUsagesOptions = createLoadOptions(getAreaUsagesAction);
  const loadRoadSurfaceConditionsOptions = createLoadOptions(
    getRoadSurfaceConditionsAction,
  );
  const loadMaxDamageSectionsOptions = createLoadOptions(
    getMaxDamageSectionsAction,
  );

  // Handle form submission
  const onSubmit: SubmitHandler<RoadDefectsFilterState> = (data) => {
    // Filter out empty arrays and undefined values
    const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          acc[key as keyof RoadDefectsFilterState] = value as any;
        }
      } else if (
        value !== undefined &&
        value !== null &&
        value.toString().trim() !== ""
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        acc[key as keyof RoadDefectsFilterState] = value as any;
      }
      return acc;
    }, {} as RoadDefectsFilterState);

    // Apply severity filter logic based on config
    if (config.lockToSevereAccidents) {
      cleanedData.deadCountMin = Math.max(cleanedData.deadCountMin || 0, 1);
      cleanedData.injuredCountMin = Math.max(
        cleanedData.injuredCountMin || 0,
        1,
      );
    }

    onApplyFilters(cleanedData);
  };

  // Reset form to defaults
  const handleReset = () => {
    const defaultValues: Partial<RoadDefectsFilterState> = {};

    // Apply locked values if severity is locked
    if (config.lockToSevereAccidents) {
      defaultValues.deadCountMin = 1;
      defaultValues.injuredCountMin = 1;
    }

    reset(defaultValues);
  };

  return (
    <div
      className="w-80 bg-gray-50 border-l border-gray-200 h-full flex flex-col"
      dir="rtl"
    >
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Basic Filters Section */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
              فیلترهای اصلی
            </h3>

            {/* Date Range */}
            <div className="grid grid-cols-1 gap-4 mb-4">
              <MyDateInput
                name="dateOfAccidentFrom"
                label="تاریخ شروع تصادف"
                control={control}
                errMsg={errors.dateOfAccidentFrom?.message}
                placeholder="از تاریخ (مثال: 1403/01/01)"
              />
              <MyDateInput
                name="dateOfAccidentTo"
                label="تاریخ پایان تصادف"
                control={control}
                errMsg={errors.dateOfAccidentTo?.message}
                placeholder="تا تاریخ (مثال: 1403/12/29)"
              />
            </div>

            {/* Geographic Filters */}
            <div className="grid grid-cols-1 gap-4 mb-4">
              <MyAsyncMultiSelect
                name="province"
                label="استان"
                setValue={setValue}
                loadOptions={loadProvincesOptions}
                errMsg={errors.province?.message}
                placeholder="انتخاب استان..."
                defaultOptions
              />
              <MyAsyncMultiSelect
                name="city"
                label="شهر"
                setValue={setValue}
                loadOptions={loadCitiesOptions}
                errMsg={errors.city?.message}
                placeholder="انتخاب شهر..."
                defaultOptions
              />
            </div>

            {/* Severity Filters */}
            {!config.disableSeverityFilter && (
              <div className="mb-4">
                {config.lockToSevereAccidents && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm text-blue-800 font-medium">
                        فیلتر تصادفات شدید فعال است
                      </span>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      فقط تصادفات با حداقل یک فوتی یا مجروح نمایش داده می‌شود
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <MyInput
                    name="deadCountMin"
                    label="حداقل تعداد فوتی"
                    register={control.register}
                    errMsg={errors.deadCountMin?.message}
                    type="number"
                    placeholder={config.lockToSevereAccidents ? "1" : "0"}
                  />
                  <MyInput
                    name="injuredCountMin"
                    label="حداقل تعداد مجروح"
                    register={control.register}
                    errMsg={errors.injuredCountMin?.message}
                    type="number"
                    placeholder={config.lockToSevereAccidents ? "1" : "0"}
                  />
                </div>

                {/* Max Damage Sections */}
                <MyAsyncMultiSelect
                  name="maxDamageSections"
                  label="بخش‌های آسیب‌دیده"
                  setValue={setValue}
                  loadOptions={loadMaxDamageSectionsOptions}
                  errMsg={errors.maxDamageSections?.message}
                  placeholder="انتخاب بخش‌های آسیب‌دیده..."
                  defaultOptions
                  defaultValue={
                    initialFilters?.maxDamageSections?.map((section) => ({
                      value: section,
                      label: section,
                    })) || []
                  }
                />
              </div>
            )}
          </div>

          {/* Dynamic Checkbox Filter Section */}
          {dynamicCheckboxFilter && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                {dynamicCheckboxFilter.title}
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {dynamicCheckboxFilter.options.map((option, index) => (
                  <label
                    key={index}
                    className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={dynamicCheckboxFilter.activeOptions.includes(
                        option,
                      )}
                      onChange={(e) => {
                        const newActiveOptions = e.target.checked
                          ? [...dynamicCheckboxFilter.activeOptions, option]
                          : dynamicCheckboxFilter.activeOptions.filter(
                              (o) => o !== option,
                            );
                        dynamicCheckboxFilter.onChange(newActiveOptions);
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
              {dynamicCheckboxFilter.options.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  هیچ گزینه‌ای در دسترس نیست
                </p>
              )}
            </div>
          )}

          {/* Advanced Filters Section */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <button
              type="button"
              onClick={() => setAdvancedFiltersOpen(!advancedFiltersOpen)}
              className="flex items-center justify-between w-full text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4 hover:text-blue-600 transition-colors"
            >
              <span>فیلترهای پیشرفته</span>
              <svg
                className={`w-5 h-5 transform transition-transform ${advancedFiltersOpen ? "rotate-180" : ""}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {advancedFiltersOpen && (
              <div className="space-y-4">
                {/* Road Defects */}
                <MyAsyncMultiSelect
                  name="roadDefects"
                  label="نوع نقایص راه"
                  setValue={setValue}
                  loadOptions={loadRoadDefectsOptions}
                  errMsg={errors.roadDefects?.message}
                  placeholder="انتخاب نقایص راه..."
                  defaultOptions
                />

                {/* Lighting Conditions */}
                {!config.disableLightingFilter && (
                  <MyAsyncMultiSelect
                    name="lightStatus"
                    label="وضعیت روشنایی"
                    setValue={setValue}
                    loadOptions={loadLightStatusesOptions}
                    errMsg={errors.lightStatus?.message}
                    placeholder="انتخاب وضعیت روشنایی..."
                    defaultOptions
                  />
                )}

                {/* Collision Types */}
                {!config.disableCollisionTypeFilter && (
                  <MyAsyncMultiSelect
                    name="collisionType"
                    label="نوع برخورد"
                    setValue={setValue}
                    loadOptions={loadCollisionTypesOptions}
                    errMsg={errors.collisionType?.message}
                    placeholder="انتخاب نوع برخورد..."
                    defaultOptions
                    defaultValue={
                      initialFilters?.collisionType?.map((type) => ({
                        value: type,
                        label: type,
                      })) || []
                    }
                  />
                )}

                {/* Weather Conditions */}
                <MyAsyncMultiSelect
                  name="airStatuses"
                  label="وضعیت جوی"
                  setValue={setValue}
                  loadOptions={loadAirStatusesOptions}
                  errMsg={errors.airStatuses?.message}
                  placeholder="انتخاب وضعیت جوی..."
                  defaultOptions
                />

                {/* Area Usage */}
                <MyAsyncMultiSelect
                  name="areaUsages"
                  label="کاربری منطقه"
                  setValue={setValue}
                  loadOptions={loadAreaUsagesOptions}
                  errMsg={errors.areaUsages?.message}
                  placeholder="انتخاب کاربری منطقه..."
                  defaultOptions
                />

                {/* Road Surface Conditions */}
                <MyAsyncMultiSelect
                  name="roadSurfaceConditions"
                  label="وضعیت سطح راه"
                  setValue={setValue}
                  loadOptions={loadRoadSurfaceConditionsOptions}
                  errMsg={errors.roadSurfaceConditions?.message}
                  placeholder="انتخاب وضعیت سطح راه..."
                  defaultOptions
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              اعمال فیلتر و نمایش تحلیل
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              پاک کردن فیلتر
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChartsFilterSidebar;
