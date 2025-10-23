"use client";

import React, { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import MyAsyncMultiSelect, { SelectOption } from "../atoms/MyAsyncMultiSelect";
import MyDateInput from "../atoms/MyDateInput";
import MyInput from "../atoms/MyInput";

// Import action functions for loading options
import { gets as getProvincesAction } from "@/app/actions/province/gets";
import { gets as getCitiesAction } from "@/app/actions/city/gets";
import { gets as getRoadsAction } from "@/app/actions/road/gets";
import { gets as getTrafficZonesAction } from "@/app/actions/traffic_zone/gets";
import { gets as getCityZonesAction } from "@/app/actions/city_zone/gets";
import { gets as getAccidentTypesAction } from "@/app/actions/type/gets";
import { gets as getPositionsAction } from "@/app/actions/position/gets";
import { gets as getRulingTypesAction } from "@/app/actions/ruling_type/gets";
import { gets as getLightStatusesAction } from "@/app/actions/light_status/gets";
import { gets as getCollisionTypesAction } from "@/app/actions/collision_type/gets";
import { gets as getRoadSituationsAction } from "@/app/actions/road_situation/gets";
import { gets as getRoadRepairTypesAction } from "@/app/actions/road_repair_type/gets";
import { gets as getShoulderStatusesAction } from "@/app/actions/shoulder_status/gets";
import { gets as getAreaUsagesAction } from "@/app/actions/area_usage/gets";
import { gets as getAirStatusesAction } from "@/app/actions/air_status/gets";
import { gets as getRoadDefectsAction } from "@/app/actions/road_defect/gets";
import { gets as getHumanReasonsAction } from "@/app/actions/human_reason/gets";
import { gets as getVehicleReasonsAction } from "@/app/actions/vehicle_reason/gets";
import { gets as getRoadSurfaceConditionsAction } from "@/app/actions/road_surface_condition/gets";
import { gets as getVehicleSystemsAction } from "@/app/actions/system/gets";
import { gets as getFaultStatusesAction } from "@/app/actions/fault_status/gets";
import { gets as getLicenceTypesAction } from "@/app/actions/licence_type/gets";
import { gets as getMaxDamageSectionsAction } from "@/app/actions/max_damage_section/gets";
import { gets as getEquipmentDamagesAction } from "@/app/actions/equipment_damage/gets";
import { gets as getSystemTypesAction } from "@/app/actions/system_type/gets";
import { gets as getBodyInsuranceCosAction } from "@/app/actions/body_insurance_co/gets";
import { gets as getInsuranceCosAction } from "@/app/actions/insurance_co/gets";
import { gets as getPlaqueTypesAction } from "@/app/actions/plaque_type/gets";
import { gets as getPlaqueUsagesAction } from "@/app/actions/plaque_usage/gets";
import { gets as getMotionDirectionsAction } from "@/app/actions/motion_direction/gets";
import { gets as getColorsAction } from "@/app/actions/color/gets";

// Configuration interface
interface ChartFilterConfig {
  disableSeverityFilter?: boolean;
  disableCollisionTypeFilter?: boolean;
  disableLightingFilter?: boolean;
  lockToSevereAccidents?: boolean;
}

// Comprehensive filter state interface for all chart pages
export interface ChartFilterState {
  // --- Pagination Controls ---
  limit?: number;
  skip?: number;

  // --- Core Accident Details ---
  seri?: number;
  serial?: number;
  dateOfAccidentFrom?: string;
  dateOfAccidentTo?: string;
  deadCount?: number;
  deadCountMin?: number;
  deadCountMax?: number;
  injuredCount?: number;
  injuredCountMin?: number;
  injuredCountMax?: number;
  hasWitness?: "true" | "false";
  newsNumber?: number;
  officer?: string;
  completionDateFrom?: string;
  completionDateTo?: string;

  // --- Location & Context (multi-select) ---
  province?: string[];
  city?: string[];
  road?: string[];
  trafficZone?: string[];
  cityZone?: string[];
  accidentType?: string[];
  position?: string[];
  rulingType?: string[];

  // --- Environmental & Reason-based (multi-select) ---
  lightStatus?: string[];
  collisionType?: string[];
  roadSituation?: string[];
  roadRepairType?: string[];
  shoulderStatus?: string[];
  areaUsages?: string[];
  airStatuses?: string[];
  roadDefects?: string[];
  humanReasons?: string[];
  vehicleReasons?: string[];
  equipmentDamages?: string[];
  roadSurfaceConditions?: string[];

  // --- Attachments ---
  attachmentName?: string;
  attachmentType?: string;

  // --- Vehicle DTOs Filters ---
  vehicleColor?: string[];
  vehicleSystem?: string[];
  vehiclePlaqueType?: string[];
  vehicleSystemType?: string[];
  vehicleFaultStatus?: string[];
  vehicleInsuranceCo?: string[];
  vehicleInsuranceNo?: string;
  vehiclePlaqueUsage?: string[];
  vehiclePrintNumber?: string;
  vehiclePlaqueSerialElement?: string;
  vehicleInsuranceDateFrom?: string;
  vehicleInsuranceDateTo?: string;
  vehicleBodyInsuranceCo?: string[];
  vehicleBodyInsuranceNo?: string;
  vehicleMotionDirection?: string[];
  vehicleBodyInsuranceDateFrom?: string;
  vehicleBodyInsuranceDateTo?: string;
  vehicleMaxDamageSections?: string[];
  vehicleDamageSectionOther?: string;
  vehicleInsuranceWarrantyLimit?: number;
  vehicleInsuranceWarrantyLimitMin?: number;
  vehicleInsuranceWarrantyLimitMax?: number;

  // --- Driver in Vehicle DTOs Filters ---
  driverSex?: string[];
  driverFirstName?: string;
  driverLastName?: string;
  driverNationalCode?: string;
  driverLicenceNumber?: string;
  driverLicenceType?: string[];
  driverInjuryType?: string[];
  driverTotalReason?: string[];

  // --- Passenger in Vehicle DTOs Filters ---
  passengerSex?: string[];
  passengerFirstName?: string;
  passengerLastName?: string;
  passengerNationalCode?: string;
  passengerInjuryType?: string[];
  passengerFaultStatus?: string[];
  passengerTotalReason?: string[];

  // --- Pedestrian DTOs Filters ---
  pedestrianSex?: string[];
  pedestrianFirstName?: string;
  pedestrianLastName?: string;
  pedestrianNationalCode?: string;
  pedestrianInjuryType?: string[];
  pedestrianFaultStatus?: string[];
  pedestrianTotalReason?: string[];
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
  onApplyFilters: (filters: ChartFilterState) => void;
  title?: string;
  description?: string;
  initialFilters?: Partial<ChartFilterState>;
  dynamicCheckboxFilter?: DynamicCheckboxFilter;
  enabledFilters: Array<keyof ChartFilterState>;
}

const ChartsFilterSidebar: React.FC<SidebarProps> = ({
  config,
  onApplyFilters,
  title = "فیلترهای تحلیل",
  description = "برای مشاهده تحلیل دقیق، فیلترهای مورد نظر را اعمال کنید",
  initialFilters,
  dynamicCheckboxFilter,
  enabledFilters,
}) => {
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ChartFilterState>({
    defaultValues: initialFilters || {},
  });

  // Set initial values
  useEffect(() => {
    if (initialFilters) {
      Object.entries(initialFilters).forEach(([key, value]) => {
        setValue(key as keyof ChartFilterState, value);
      });
    }
  }, [initialFilters, setValue]);

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
  const loadRoadsOptions = createLoadOptions(getRoadsAction);
  const loadTrafficZonesOptions = createLoadOptions(getTrafficZonesAction);
  const loadCityZonesOptions = createLoadOptions(getCityZonesAction);
  const loadAccidentTypesOptions = createLoadOptions(getAccidentTypesAction);
  const loadPositionsOptions = createLoadOptions(getPositionsAction);
  const loadRulingTypesOptions = createLoadOptions(getRulingTypesAction);
  const loadLightStatusesOptions = createLoadOptions(getLightStatusesAction);
  const loadCollisionTypesOptions = createLoadOptions(getCollisionTypesAction);
  const loadRoadSituationsOptions = createLoadOptions(getRoadSituationsAction);
  const loadRoadRepairTypesOptions = createLoadOptions(
    getRoadRepairTypesAction,
  );
  const loadShoulderStatusesOptions = createLoadOptions(
    getShoulderStatusesAction,
  );
  const loadAreaUsagesOptions = createLoadOptions(getAreaUsagesAction);
  const loadAirStatusesOptions = createLoadOptions(getAirStatusesAction);
  const loadRoadDefectsOptions = createLoadOptions(getRoadDefectsAction);
  const loadHumanReasonsOptions = createLoadOptions(getHumanReasonsAction);
  const loadVehicleReasonsOptions = createLoadOptions(getVehicleReasonsAction);
  const loadRoadSurfaceConditionsOptions = createLoadOptions(
    getRoadSurfaceConditionsAction,
  );
  const loadVehicleSystemsOptions = createLoadOptions(getVehicleSystemsAction);
  const loadFaultStatusesOptions = createLoadOptions(getFaultStatusesAction);
  const loadLicenceTypesOptions = createLoadOptions(getLicenceTypesAction);
  const loadMaxDamageSectionsOptions = createLoadOptions(
    getMaxDamageSectionsAction,
  );
  const loadEquipmentDamagesOptions = createLoadOptions(
    getEquipmentDamagesAction,
  );
  const loadSystemTypesOptions = createLoadOptions(getSystemTypesAction);
  const loadBodyInsuranceCosOptions = createLoadOptions(
    getBodyInsuranceCosAction,
  );
  const loadInsuranceCosOptions = createLoadOptions(getInsuranceCosAction);
  const loadPlaqueTypesOptions = createLoadOptions(getPlaqueTypesAction);
  const loadPlaqueUsagesOptions = createLoadOptions(getPlaqueUsagesAction);
  const loadMotionDirectionsOptions = createLoadOptions(
    getMotionDirectionsAction,
  );
  const loadColorsOptions = createLoadOptions(getColorsAction);

  // Handle form submission
  const onSubmit: SubmitHandler<ChartFilterState> = (data) => {
    // Filter out empty arrays and undefined values
    const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          acc[key as keyof ChartFilterState] = value as any;
        }
      } else if (value !== undefined && value !== null && value !== "") {
        // For numeric fields, convert to number; for others, keep as string
        const numericFields = [
          "limit",
          "skip",
          "deadCountMin",
          "deadCountMax",
          "injuredCountMin",
          "injuredCountMax",
          "seri",
          "serial",
        ];
        if (numericFields.includes(key)) {
          const numValue = Number(value);
          if (!isNaN(numValue)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            acc[key as keyof ChartFilterState] = numValue as any;
          }
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          acc[key as keyof ChartFilterState] = value as any;
        }
      }
      return acc;
    }, {} as ChartFilterState);

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
    const defaultValues: Partial<ChartFilterState> = {};

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
            {(enabledFilters.includes("dateOfAccidentFrom") ||
              enabledFilters.includes("dateOfAccidentTo")) && (
              <div className="grid grid-cols-1 gap-4 mb-4">
                {enabledFilters.includes("dateOfAccidentFrom") && (
                  <MyDateInput
                    name="dateOfAccidentFrom"
                    label="تاریخ شروع تصادف"
                    control={control}
                    errMsg={errors.dateOfAccidentFrom?.message}
                    placeholder="از تاریخ (مثال: 1403/01/01)"
                  />
                )}
                {enabledFilters.includes("dateOfAccidentTo") && (
                  <MyDateInput
                    name="dateOfAccidentTo"
                    label="تاریخ پایان تصادف"
                    control={control}
                    errMsg={errors.dateOfAccidentTo?.message}
                    placeholder="تا تاریخ (مثال: 1403/12/29)"
                  />
                )}
              </div>
            )}

            {/* Geographic Filters */}
            {(enabledFilters.includes("province") ||
              enabledFilters.includes("city") ||
              enabledFilters.includes("road") ||
              enabledFilters.includes("trafficZone") ||
              enabledFilters.includes("cityZone")) && (
              <div className="grid grid-cols-1 gap-4 mb-4">
                {enabledFilters.includes("province") && (
                  <MyAsyncMultiSelect
                    name="province"
                    label="استان"
                    setValue={setValue}
                    loadOptions={loadProvincesOptions}
                    errMsg={errors.province?.message}
                    placeholder="انتخاب استان..."
                    defaultOptions
                  />
                )}
                {enabledFilters.includes("city") && (
                  <MyAsyncMultiSelect
                    name="city"
                    label="شهر"
                    setValue={setValue}
                    loadOptions={loadCitiesOptions}
                    errMsg={errors.city?.message}
                    placeholder="انتخاب شهر..."
                    defaultOptions
                  />
                )}
                {enabledFilters.includes("road") && (
                  <MyAsyncMultiSelect
                    name="road"
                    label="راه"
                    setValue={setValue}
                    loadOptions={loadRoadsOptions}
                    errMsg={errors.road?.message}
                    placeholder="انتخاب راه..."
                    defaultOptions
                  />
                )}
                {enabledFilters.includes("trafficZone") && (
                  <MyAsyncMultiSelect
                    name="trafficZone"
                    label="منطقه ترافیکی"
                    setValue={setValue}
                    loadOptions={loadTrafficZonesOptions}
                    errMsg={errors.trafficZone?.message}
                    placeholder="انتخاب منطقه ترافیکی..."
                    defaultOptions
                  />
                )}
                {enabledFilters.includes("cityZone") && (
                  <MyAsyncMultiSelect
                    name="cityZone"
                    label="منطقه شهری"
                    setValue={setValue}
                    loadOptions={loadCityZonesOptions}
                    errMsg={errors.cityZone?.message}
                    placeholder="انتخاب منطقه شهری..."
                    defaultOptions
                  />
                )}
              </div>
            )}

            {/* Accident Type and Position */}
            {(enabledFilters.includes("accidentType") ||
              enabledFilters.includes("position") ||
              enabledFilters.includes("rulingType")) && (
              <div className="grid grid-cols-1 gap-4 mb-4">
                {enabledFilters.includes("accidentType") && (
                  <MyAsyncMultiSelect
                    name="accidentType"
                    label="نوع تصادف"
                    setValue={setValue}
                    loadOptions={loadAccidentTypesOptions}
                    errMsg={errors.accidentType?.message}
                    placeholder="انتخاب نوع تصادف..."
                    defaultOptions
                  />
                )}
                {enabledFilters.includes("position") && (
                  <MyAsyncMultiSelect
                    name="position"
                    label="موقعیت"
                    setValue={setValue}
                    loadOptions={loadPositionsOptions}
                    errMsg={errors.position?.message}
                    placeholder="انتخاب موقعیت..."
                    defaultOptions
                  />
                )}
                {enabledFilters.includes("rulingType") && (
                  <MyAsyncMultiSelect
                    name="rulingType"
                    label="نوع حکم"
                    setValue={setValue}
                    loadOptions={loadRulingTypesOptions}
                    errMsg={errors.rulingType?.message}
                    placeholder="انتخاب نوع حکم..."
                    defaultOptions
                  />
                )}
              </div>
            )}

            {/* Officer Field */}
            {enabledFilters.includes("officer") && (
              <div className="grid grid-cols-1 gap-4 mb-4">
                <MyInput
                  name="officer"
                  label="افسر مسئول"
                  register={control.register}
                  errMsg={errors.officer?.message}
                  type="text"
                  placeholder="نام افسر مسئول..."
                />
              </div>
            )}

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
                {(enabledFilters.includes("deadCountMin") ||
                  enabledFilters.includes("deadCountMax")) && (
                  <div className="grid grid-cols-2 gap-4">
                    {enabledFilters.includes("deadCountMin") && (
                      <MyInput
                        name="deadCountMin"
                        label="حداقل تعداد فوتی"
                        register={control.register}
                        errMsg={errors.deadCountMin?.message}
                        type="number"
                        placeholder={config.lockToSevereAccidents ? "1" : "0"}
                      />
                    )}
                    {enabledFilters.includes("deadCountMax") && (
                      <MyInput
                        name="deadCountMax"
                        label="حداکثر تعداد فوتی"
                        register={control.register}
                        errMsg={errors.deadCountMax?.message}
                        type="number"
                        placeholder="حداکثر..."
                      />
                    )}
                  </div>
                )}

                {(enabledFilters.includes("injuredCountMin") ||
                  enabledFilters.includes("injuredCountMax")) && (
                  <div className="grid grid-cols-2 gap-4">
                    {enabledFilters.includes("injuredCountMin") && (
                      <MyInput
                        name="injuredCountMin"
                        label="حداقل تعداد مجروح"
                        register={control.register}
                        errMsg={errors.injuredCountMin?.message}
                        type="number"
                        placeholder={config.lockToSevereAccidents ? "1" : "0"}
                      />
                    )}
                    {enabledFilters.includes("injuredCountMax") && (
                      <MyInput
                        name="injuredCountMax"
                        label="حداکثر تعداد مجروح"
                        register={control.register}
                        errMsg={errors.injuredCountMax?.message}
                        type="number"
                        placeholder="حداکثر..."
                      />
                    )}
                  </div>
                )}

                {/* Pagination Controls */}
                {(enabledFilters.includes("limit") ||
                  enabledFilters.includes("skip")) && (
                  <div className="grid grid-cols-2 gap-4">
                    {enabledFilters.includes("limit") && (
                      <MyInput
                        name="limit"
                        label="تعداد نتایج"
                        register={control.register}
                        errMsg={errors.limit?.message}
                        type="number"
                        placeholder="1000"
                      />
                    )}
                    {enabledFilters.includes("skip") && (
                      <MyInput
                        name="skip"
                        label="رد کردن نتایج"
                        register={control.register}
                        errMsg={errors.skip?.message}
                        type="number"
                        placeholder="0"
                      />
                    )}
                  </div>
                )}

                {/* Serial Number Fields */}
                {(enabledFilters.includes("seri") ||
                  enabledFilters.includes("serial")) && (
                  <div className="grid grid-cols-2 gap-4">
                    {enabledFilters.includes("seri") && (
                      <MyInput
                        name="seri"
                        label="شماره سری"
                        register={control.register}
                        errMsg={errors.seri?.message}
                        type="number"
                        placeholder="شماره سری..."
                      />
                    )}
                    {enabledFilters.includes("serial") && (
                      <MyInput
                        name="serial"
                        label="شماره سریال"
                        register={control.register}
                        errMsg={errors.serial?.message}
                        type="number"
                        placeholder="شماره سریال..."
                      />
                    )}
                  </div>
                )}
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
                {/* Core Accident Details */}
                <h4 className="text-sm font-medium text-gray-800 border-b border-gray-200 pb-2">
                  جزئیات اصلی تصادف
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {enabledFilters.includes("deadCount") && (
                    <MyInput
                      name="deadCount"
                      label="تعداد دقیق فوتی"
                      register={control.register}
                      errMsg={errors.deadCount?.message}
                      type="number"
                    />
                  )}
                  {enabledFilters.includes("injuredCount") && (
                    <MyInput
                      name="injuredCount"
                      label="تعداد دقیق مجروح"
                      register={control.register}
                      errMsg={errors.injuredCount?.message}
                      type="number"
                    />
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {enabledFilters.includes("hasWitness") && (
                    <MyInput
                      name="hasWitness"
                      label="وجود شاهد"
                      register={control.register}
                      errMsg={errors.hasWitness?.message}
                      type="text"
                      placeholder="true یا false"
                    />
                  )}
                  {enabledFilters.includes("newsNumber") && (
                    <MyInput
                      name="newsNumber"
                      label="شماره خبر"
                      register={control.register}
                      errMsg={errors.newsNumber?.message}
                      type="number"
                    />
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {enabledFilters.includes("completionDateFrom") && (
                    <MyDateInput
                      name="completionDateFrom"
                      label="تاریخ تکمیل از"
                      control={control}
                      errMsg={errors.completionDateFrom?.message}
                    />
                  )}
                  {enabledFilters.includes("completionDateTo") && (
                    <MyDateInput
                      name="completionDateTo"
                      label="تاریخ تکمیل تا"
                      control={control}
                      errMsg={errors.completionDateTo?.message}
                    />
                  )}
                </div>

                {/* Attachments */}
                <h4 className="text-sm font-medium text-gray-800 border-b border-gray-200 pb-2">
                  پیوست‌ها
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  {enabledFilters.includes("attachmentName") && (
                    <MyInput
                      name="attachmentName"
                      label="نام پیوست"
                      register={control.register}
                      errMsg={errors.attachmentName?.message}
                      type="text"
                    />
                  )}
                  {enabledFilters.includes("attachmentType") && (
                    <MyInput
                      name="attachmentType"
                      label="نوع پیوست"
                      register={control.register}
                      errMsg={errors.attachmentType?.message}
                      type="text"
                    />
                  )}
                </div>

                {/* Road and Infrastructure */}
                <h4 className="text-sm font-medium text-gray-800 border-b border-gray-200 pb-2">
                  شرایط راه و محیط
                </h4>
                {enabledFilters.includes("roadSituation") && (
                  <MyAsyncMultiSelect
                    name="roadSituation"
                    label="وضعیت راه"
                    setValue={setValue}
                    loadOptions={loadRoadSituationsOptions}
                    errMsg={errors.roadSituation?.message}
                    placeholder="انتخاب وضعیت راه..."
                    defaultOptions
                  />
                )}

                {enabledFilters.includes("roadRepairType") && (
                  <MyAsyncMultiSelect
                    name="roadRepairType"
                    label="نوع تعمیر راه"
                    setValue={setValue}
                    loadOptions={loadRoadRepairTypesOptions}
                    errMsg={errors.roadRepairType?.message}
                    placeholder="انتخاب نوع تعمیر راه..."
                    defaultOptions
                  />
                )}

                {enabledFilters.includes("shoulderStatus") && (
                  <MyAsyncMultiSelect
                    name="shoulderStatus"
                    label="وضعیت شانه راه"
                    setValue={setValue}
                    loadOptions={loadShoulderStatusesOptions}
                    errMsg={errors.shoulderStatus?.message}
                    placeholder="انتخاب وضعیت شانه راه..."
                    defaultOptions
                  />
                )}

                {enabledFilters.includes("roadDefects") && (
                  <MyAsyncMultiSelect
                    name="roadDefects"
                    label="نوع نقایص راه"
                    setValue={setValue}
                    loadOptions={loadRoadDefectsOptions}
                    errMsg={errors.roadDefects?.message}
                    placeholder="انتخاب نقایص راه..."
                    defaultOptions
                  />
                )}

                {!config.disableLightingFilter &&
                  enabledFilters.includes("lightStatus") && (
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

                {!config.disableCollisionTypeFilter &&
                  enabledFilters.includes("collisionType") && (
                    <MyAsyncMultiSelect
                      name="collisionType"
                      label="نوع برخورد"
                      setValue={setValue}
                      loadOptions={loadCollisionTypesOptions}
                      errMsg={errors.collisionType?.message}
                      placeholder="انتخاب نوع برخورد..."
                      defaultOptions
                    />
                  )}

                {enabledFilters.includes("airStatuses") && (
                  <MyAsyncMultiSelect
                    name="airStatuses"
                    label="وضعیت جوی"
                    setValue={setValue}
                    loadOptions={loadAirStatusesOptions}
                    errMsg={errors.airStatuses?.message}
                    placeholder="انتخاب وضعیت جوی..."
                    defaultOptions
                  />
                )}

                {enabledFilters.includes("areaUsages") && (
                  <MyAsyncMultiSelect
                    name="areaUsages"
                    label="کاربری منطقه"
                    setValue={setValue}
                    loadOptions={loadAreaUsagesOptions}
                    errMsg={errors.areaUsages?.message}
                    placeholder="انتخاب کاربری منطقه..."
                    defaultOptions
                  />
                )}

                {enabledFilters.includes("roadSurfaceConditions") && (
                  <MyAsyncMultiSelect
                    name="roadSurfaceConditions"
                    label="وضعیت سطح راه"
                    setValue={setValue}
                    loadOptions={loadRoadSurfaceConditionsOptions}
                    errMsg={errors.roadSurfaceConditions?.message}
                    placeholder="انتخاب وضعیت سطح راه..."
                    defaultOptions
                  />
                )}

                {/* Reasons */}
                <h4 className="text-sm font-medium text-gray-800 border-b border-gray-200 pb-2">
                  علل تصادف
                </h4>
                {enabledFilters.includes("humanReasons") && (
                  <MyAsyncMultiSelect
                    name="humanReasons"
                    label="علل انسانی"
                    setValue={setValue}
                    loadOptions={loadHumanReasonsOptions}
                    errMsg={errors.humanReasons?.message}
                    placeholder="انتخاب علل انسانی..."
                    defaultOptions
                  />
                )}

                {enabledFilters.includes("vehicleReasons") && (
                  <MyAsyncMultiSelect
                    name="vehicleReasons"
                    label="علل وسیله نقلیه"
                    setValue={setValue}
                    loadOptions={loadVehicleReasonsOptions}
                    errMsg={errors.vehicleReasons?.message}
                    placeholder="انتخاب علل وسیله نقلیه..."
                    defaultOptions
                  />
                )}

                {/* Vehicle Details */}
                <h4 className="text-sm font-medium text-gray-800 border-b border-gray-200 pb-2">
                  جزئیات وسیله نقلیه
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  {enabledFilters.includes("vehicleInsuranceNo") && (
                    <MyInput
                      name="vehicleInsuranceNo"
                      label="شماره بیمه شخص ثالث"
                      register={control.register}
                      errMsg={errors.vehicleInsuranceNo?.message}
                      type="text"
                    />
                  )}
                  {enabledFilters.includes("vehicleBodyInsuranceNo") && (
                    <MyInput
                      name="vehicleBodyInsuranceNo"
                      label="شماره بیمه بدنه"
                      register={control.register}
                      errMsg={errors.vehicleBodyInsuranceNo?.message}
                      type="text"
                    />
                  )}
                  {enabledFilters.includes("vehiclePrintNumber") && (
                    <MyInput
                      name="vehiclePrintNumber"
                      label="شماره چاپ پلاک"
                      register={control.register}
                      errMsg={errors.vehiclePrintNumber?.message}
                      type="text"
                    />
                  )}
                  {enabledFilters.includes("vehiclePlaqueSerialElement") && (
                    <MyInput
                      name="vehiclePlaqueSerialElement"
                      label="سریال پلاک"
                      register={control.register}
                      errMsg={errors.vehiclePlaqueSerialElement?.message}
                      type="text"
                    />
                  )}
                  {enabledFilters.includes("vehicleDamageSectionOther") && (
                    <MyInput
                      name="vehicleDamageSectionOther"
                      label="سایر بخش‌های آسیب‌دیده"
                      register={control.register}
                      errMsg={errors.vehicleDamageSectionOther?.message}
                      type="text"
                    />
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {enabledFilters.includes("vehicleInsuranceDateFrom") && (
                    <MyDateInput
                      name="vehicleInsuranceDateFrom"
                      label="تاریخ بیمه شخص ثالث از"
                      control={control}
                      errMsg={errors.vehicleInsuranceDateFrom?.message}
                    />
                  )}
                  {enabledFilters.includes("vehicleInsuranceDateTo") && (
                    <MyDateInput
                      name="vehicleInsuranceDateTo"
                      label="تاریخ بیمه شخص ثالث تا"
                      control={control}
                      errMsg={errors.vehicleInsuranceDateTo?.message}
                    />
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {enabledFilters.includes("vehicleBodyInsuranceDateFrom") && (
                    <MyDateInput
                      name="vehicleBodyInsuranceDateFrom"
                      label="تاریخ بیمه بدنه از"
                      control={control}
                      errMsg={errors.vehicleBodyInsuranceDateFrom?.message}
                    />
                  )}
                  {enabledFilters.includes("vehicleBodyInsuranceDateTo") && (
                    <MyDateInput
                      name="vehicleBodyInsuranceDateTo"
                      label="تاریخ بیمه بدنه تا"
                      control={control}
                      errMsg={errors.vehicleBodyInsuranceDateTo?.message}
                    />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {enabledFilters.includes(
                    "vehicleInsuranceWarrantyLimitMin",
                  ) && (
                    <MyInput
                      name="vehicleInsuranceWarrantyLimitMin"
                      label="حداقل تعهد بیمه"
                      register={control.register}
                      errMsg={errors.vehicleInsuranceWarrantyLimitMin?.message}
                      type="number"
                    />
                  )}
                  {enabledFilters.includes(
                    "vehicleInsuranceWarrantyLimitMax",
                  ) && (
                    <MyInput
                      name="vehicleInsuranceWarrantyLimitMax"
                      label="حداکثر تعهد بیمه"
                      register={control.register}
                      errMsg={errors.vehicleInsuranceWarrantyLimitMax?.message}
                      type="number"
                    />
                  )}
                </div>

                {enabledFilters.includes("vehicleSystem") && (
                  <MyAsyncMultiSelect
                    name="vehicleSystem"
                    label="سیستم وسیله نقلیه"
                    setValue={setValue}
                    loadOptions={loadVehicleSystemsOptions}
                    errMsg={errors.vehicleSystem?.message}
                    placeholder="انتخاب سیستم..."
                    defaultOptions
                  />
                )}
                {enabledFilters.includes("vehicleSystemType") && (
                  <MyAsyncMultiSelect
                    name="vehicleSystemType"
                    label="نوع سیستم وسیله نقلیه"
                    setValue={setValue}
                    loadOptions={loadSystemTypesOptions}
                    errMsg={errors.vehicleSystemType?.message}
                    placeholder="انتخاب نوع سیستم..."
                    defaultOptions
                  />
                )}
                {enabledFilters.includes("vehicleColor") && (
                  <MyAsyncMultiSelect
                    name="vehicleColor"
                    label="رنگ وسیله نقلیه"
                    setValue={setValue}
                    loadOptions={loadColorsOptions}
                    errMsg={errors.vehicleColor?.message}
                    placeholder="انتخاب رنگ..."
                    defaultOptions
                  />
                )}
                {enabledFilters.includes("vehiclePlaqueType") && (
                  <MyAsyncMultiSelect
                    name="vehiclePlaqueType"
                    label="نوع پلاک"
                    setValue={setValue}
                    loadOptions={loadPlaqueTypesOptions}
                    errMsg={errors.vehiclePlaqueType?.message}
                    placeholder="انتخاب نوع پلاک..."
                    defaultOptions
                  />
                )}
                {enabledFilters.includes("vehiclePlaqueUsage") && (
                  <MyAsyncMultiSelect
                    name="vehiclePlaqueUsage"
                    label="کاربری پلاک"
                    setValue={setValue}
                    loadOptions={loadPlaqueUsagesOptions}
                    errMsg={errors.vehiclePlaqueUsage?.message}
                    placeholder="انتخاب کاربری پلاک..."
                    defaultOptions
                  />
                )}
                {enabledFilters.includes("vehicleMotionDirection") && (
                  <MyAsyncMultiSelect
                    name="vehicleMotionDirection"
                    label="جهت حرکت وسیله نقلیه"
                    setValue={setValue}
                    loadOptions={loadMotionDirectionsOptions}
                    errMsg={errors.vehicleMotionDirection?.message}
                    placeholder="انتخاب جهت حرکت..."
                    defaultOptions
                  />
                )}
                {enabledFilters.includes("vehicleFaultStatus") && (
                  <MyAsyncMultiSelect
                    name="vehicleFaultStatus"
                    label="وضعیت خطای وسیله نقلیه"
                    setValue={setValue}
                    loadOptions={loadFaultStatusesOptions}
                    errMsg={errors.vehicleFaultStatus?.message}
                    placeholder="انتخاب وضعیت خطا..."
                    defaultOptions
                  />
                )}
                {enabledFilters.includes("vehicleInsuranceCo") && (
                  <MyAsyncMultiSelect
                    name="vehicleInsuranceCo"
                    label="شرکت بیمه شخص ثالث"
                    setValue={setValue}
                    loadOptions={loadInsuranceCosOptions}
                    errMsg={errors.vehicleInsuranceCo?.message}
                    placeholder="انتخاب شرکت بیمه..."
                    defaultOptions
                  />
                )}
                {enabledFilters.includes("vehicleBodyInsuranceCo") && (
                  <MyAsyncMultiSelect
                    name="vehicleBodyInsuranceCo"
                    label="شرکت بیمه بدنه"
                    setValue={setValue}
                    loadOptions={loadBodyInsuranceCosOptions}
                    errMsg={errors.vehicleBodyInsuranceCo?.message}
                    placeholder="انتخاب شرکت بیمه..."
                    defaultOptions
                  />
                )}
                {enabledFilters.includes("vehicleMaxDamageSections") && (
                  <MyAsyncMultiSelect
                    name="vehicleMaxDamageSections"
                    label="بخش‌های آسیب‌دیده"
                    setValue={setValue}
                    loadOptions={loadMaxDamageSectionsOptions}
                    errMsg={errors.vehicleMaxDamageSections?.message}
                    placeholder="انتخاب بخش‌های آسیب‌دیده..."
                    defaultOptions
                  />
                )}
                {enabledFilters.includes("equipmentDamages") && (
                  <MyAsyncMultiSelect
                    name="equipmentDamages"
                    label="خسارت تجهیزات"
                    setValue={setValue}
                    loadOptions={loadEquipmentDamagesOptions}
                    errMsg={errors.equipmentDamages?.message}
                    placeholder="انتخاب خسارت تجهیزات..."
                    defaultOptions
                  />
                )}

                {/* Person Details */}
                <h4 className="text-sm font-medium text-gray-800 border-b border-gray-200 pb-2">
                  جزئیات اشخاص
                </h4>
                {/* Driver */}
                <h5 className="text-sm font-medium text-gray-700 pt-2">
                  راننده
                </h5>
                <div className="grid grid-cols-1 gap-4">
                  {enabledFilters.includes("driverFirstName") && (
                    <MyInput
                      name="driverFirstName"
                      label="نام راننده"
                      register={control.register}
                      errMsg={errors.driverFirstName?.message}
                      type="text"
                    />
                  )}
                  {enabledFilters.includes("driverLastName") && (
                    <MyInput
                      name="driverLastName"
                      label="نام خانوادگی راننده"
                      register={control.register}
                      errMsg={errors.driverLastName?.message}
                      type="text"
                    />
                  )}
                  {enabledFilters.includes("driverNationalCode") && (
                    <MyInput
                      name="driverNationalCode"
                      label="کد ملی راننده"
                      register={control.register}
                      errMsg={errors.driverNationalCode?.message}
                      type="text"
                    />
                  )}
                  {enabledFilters.includes("driverLicenceNumber") && (
                    <MyInput
                      name="driverLicenceNumber"
                      label="شماره گواهینامه"
                      register={control.register}
                      errMsg={errors.driverLicenceNumber?.message}
                      type="text"
                    />
                  )}
                </div>
                {enabledFilters.includes("driverSex") && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      جنسیت راننده
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          value="مرد"
                          {...control.register("driverSex")}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="mr-2 text-sm text-gray-700">مرد</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          value="زن"
                          {...control.register("driverSex")}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="mr-2 text-sm text-gray-700">زن</span>
                      </label>
                    </div>
                  </div>
                )}
                {enabledFilters.includes("driverLicenceType") && (
                  <MyAsyncMultiSelect
                    name="driverLicenceType"
                    label="نوع گواهینامه راننده"
                    setValue={setValue}
                    loadOptions={loadLicenceTypesOptions}
                    errMsg={errors.driverLicenceType?.message}
                    placeholder="انتخاب نوع گواهینامه..."
                    defaultOptions
                  />
                )}
                {enabledFilters.includes("driverInjuryType") && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      نوع آسیب راننده
                    </label>
                    <div className="flex gap-4 flex-wrap">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          value="فوتی"
                          {...control.register("driverInjuryType")}
                          className="w-4 h-4"
                        />
                        <span className="mr-2 text-sm">فوتی</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          value="مجروح"
                          {...control.register("driverInjuryType")}
                          className="w-4 h-4"
                        />
                        <span className="mr-2 text-sm">مجروح</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          value="سالم"
                          {...control.register("driverInjuryType")}
                          className="w-4 h-4"
                        />
                        <span className="mr-2 text-sm">سالم</span>
                      </label>
                    </div>
                  </div>
                )}
                {enabledFilters.includes("driverTotalReason") && (
                  <MyAsyncMultiSelect
                    name="driverTotalReason"
                    label="علت اصلی راننده"
                    setValue={setValue}
                    loadOptions={loadHumanReasonsOptions}
                    errMsg={errors.driverTotalReason?.message}
                    placeholder="انتخاب علت اصلی..."
                    defaultOptions
                  />
                )}

                {/* Passenger */}
                <h5 className="text-sm font-medium text-gray-700 pt-2">
                  جزئیات سرنشین
                </h5>
                <div className="grid grid-cols-1 gap-4">
                  {enabledFilters.includes("passengerFirstName") && (
                    <MyInput
                      name="passengerFirstName"
                      label="نام سرنشین"
                      register={control.register}
                      errMsg={errors.passengerFirstName?.message}
                      type="text"
                    />
                  )}
                  {enabledFilters.includes("passengerLastName") && (
                    <MyInput
                      name="passengerLastName"
                      label="نام خانوادگی سرنشین"
                      register={control.register}
                      errMsg={errors.passengerLastName?.message}
                      type="text"
                    />
                  )}
                  {enabledFilters.includes("passengerNationalCode") && (
                    <MyInput
                      name="passengerNationalCode"
                      label="کد ملی سرنشین"
                      register={control.register}
                      errMsg={errors.passengerNationalCode?.message}
                      type="text"
                    />
                  )}
                </div>
                {enabledFilters.includes("passengerSex") && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      جنسیت سرنشین
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          value="مرد"
                          {...control.register("passengerSex")}
                          className="w-4 h-4"
                        />
                        <span className="mr-2 text-sm">مرد</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          value="زن"
                          {...control.register("passengerSex")}
                          className="w-4 h-4"
                        />
                        <span className="mr-2 text-sm">زن</span>
                      </label>
                    </div>
                  </div>
                )}
                {enabledFilters.includes("passengerInjuryType") && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      نوع آسیب سرنشین
                    </label>
                    <div className="flex gap-4 flex-wrap">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          value="فوتی"
                          {...control.register("passengerInjuryType")}
                          className="w-4 h-4"
                        />
                        <span className="mr-2 text-sm">فوتی</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          value="مجروح"
                          {...control.register("passengerInjuryType")}
                          className="w-4 h-4"
                        />
                        <span className="mr-2 text-sm">مجروح</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          value="سالم"
                          {...control.register("passengerInjuryType")}
                          className="w-4 h-4"
                        />
                        <span className="mr-2 text-sm">سالم</span>
                      </label>
                    </div>
                  </div>
                )}
                {enabledFilters.includes("passengerFaultStatus") && (
                  <MyAsyncMultiSelect
                    name="passengerFaultStatus"
                    label="وضعیت خطای سرنشین"
                    setValue={setValue}
                    loadOptions={loadFaultStatusesOptions}
                    errMsg={errors.passengerFaultStatus?.message}
                    placeholder="انتخاب وضعیت خطا..."
                    defaultOptions
                  />
                )}
                {enabledFilters.includes("passengerTotalReason") && (
                  <MyAsyncMultiSelect
                    name="passengerTotalReason"
                    label="علت اصلی سرنشین"
                    setValue={setValue}
                    loadOptions={loadHumanReasonsOptions}
                    errMsg={errors.passengerTotalReason?.message}
                    placeholder="انتخاب علت اصلی..."
                    defaultOptions
                  />
                )}

                {/* Pedestrian */}
                <h5 className="text-sm font-medium text-gray-700 pt-2">
                  جزئیات عابر پیاده
                </h5>
                <div className="grid grid-cols-1 gap-4">
                  {enabledFilters.includes("pedestrianFirstName") && (
                    <MyInput
                      name="pedestrianFirstName"
                      label="نام عابر"
                      register={control.register}
                      errMsg={errors.pedestrianFirstName?.message}
                      type="text"
                    />
                  )}
                  {enabledFilters.includes("pedestrianLastName") && (
                    <MyInput
                      name="pedestrianLastName"
                      label="نام خانوادگی عابر"
                      register={control.register}
                      errMsg={errors.pedestrianLastName?.message}
                      type="text"
                    />
                  )}
                  {enabledFilters.includes("pedestrianNationalCode") && (
                    <MyInput
                      name="pedestrianNationalCode"
                      label="کد ملی عابر"
                      register={control.register}
                      errMsg={errors.pedestrianNationalCode?.message}
                      type="text"
                    />
                  )}
                </div>
                {enabledFilters.includes("pedestrianSex") && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      جنسیت عابر پیاده
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          value="مرد"
                          {...control.register("pedestrianSex")}
                          className="w-4 h-4"
                        />
                        <span className="mr-2 text-sm">مرد</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          value="زن"
                          {...control.register("pedestrianSex")}
                          className="w-4 h-4"
                        />
                        <span className="mr-2 text-sm">زن</span>
                      </label>
                    </div>
                  </div>
                )}
                {enabledFilters.includes("pedestrianInjuryType") && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      نوع آسیب عابر پیاده
                    </label>
                    <div className="flex gap-4 flex-wrap">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          value="فوتی"
                          {...control.register("pedestrianInjuryType")}
                          className="w-4 h-4"
                        />
                        <span className="mr-2 text-sm">فوتی</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          value="مجروح"
                          {...control.register("pedestrianInjuryType")}
                          className="w-4 h-4"
                        />
                        <span className="mr-2 text-sm">مجروح</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          value="سالم"
                          {...control.register("pedestrianInjuryType")}
                          className="w-4 h-4"
                        />
                        <span className="mr-2 text-sm">سالم</span>
                      </label>
                    </div>
                  </div>
                )}
                {enabledFilters.includes("pedestrianFaultStatus") && (
                  <MyAsyncMultiSelect
                    name="pedestrianFaultStatus"
                    label="وضعیت خطای عابر پیاده"
                    setValue={setValue}
                    loadOptions={loadFaultStatusesOptions}
                    errMsg={errors.pedestrianFaultStatus?.message}
                    placeholder="انتخاب وضعیت خطا..."
                    defaultOptions
                  />
                )}
                {enabledFilters.includes("pedestrianTotalReason") && (
                  <MyAsyncMultiSelect
                    name="pedestrianTotalReason"
                    label="علت اصلی عابر پیاده"
                    setValue={setValue}
                    loadOptions={loadHumanReasonsOptions}
                    errMsg={errors.pedestrianTotalReason?.message}
                    placeholder="انتخاب علت اصلی..."
                    defaultOptions
                  />
                )}
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
