// =========================================================================
// src/components/dashboards/GlobalFiltersBar.tsx
// Collapsible right-side global filter bar with FAB toggle
// =========================================================================

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import MyAsyncMultiSelect, { SelectOption } from "../atoms/MyAsyncMultiSelect";
import MyDateInput from "../atoms/MyDateInput";
import MyInput from "../atoms/MyInput";
import { useGlobalChartFilters } from "@/context/GlobalChartFiltersContext";
import { ChartFilterState } from "./ChartsFilterSidebar";
import { ReqType } from "@/types/declarations/selectInp";

import { gets as getProvincesAction } from "@/app/actions/province/gets";
import { gets as getCitiesAction } from "@/app/actions/city/gets";
import { gets as getRoadsAction } from "@/app/actions/road/gets";
import { gets as getAccidentTypesAction } from "@/app/actions/type/gets";
import { gets as getCollisionTypesAction } from "@/app/actions/collision_type/gets";
import { gets as getLightStatusesAction } from "@/app/actions/light_status/gets";
import { gets as getRoadSituationsAction } from "@/app/actions/road_situation/gets";
import { gets as getRoadDefectsAction } from "@/app/actions/road_defect/gets";
import { gets as getAirStatusesAction } from "@/app/actions/air_status/gets";
import { gets as getAreaUsagesAction } from "@/app/actions/area_usage/gets";
import { gets as getHumanReasonsAction } from "@/app/actions/human_reason/gets";
import { gets as getVehicleReasonsAction } from "@/app/actions/vehicle_reason/gets";
import { gets as getVehicleSystemsAction } from "@/app/actions/system/gets";
import { gets as getFaultStatusesAction } from "@/app/actions/fault_status/gets";
import { gets as getPlaqueTypesAction } from "@/app/actions/plaque_type/gets";
import { gets as getColorsAction } from "@/app/actions/color/gets";

export default function GlobalFiltersBar() {
  const [isOpen, setIsOpen] = useState(false);
  const { globalFilters, setGlobalFilters, clearGlobalFilters, hasGlobalFilters, globalFilterCount, globalFiltersVersion } = useGlobalChartFilters();
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ChartFilterState>({
    defaultValues: globalFilters,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createLoadOptions = (action: (args: any) => Promise<any>) =>
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return response.body.map((item: any) => ({
            value: item.name,
            label: item.name,
          }));
        }
      } catch {
        // ignore
      }
      return [];
    };

  const loadProvincesOptions = createLoadOptions(getProvincesAction);
  const loadAccidentTypesOptions = createLoadOptions(getAccidentTypesAction);
  const loadCollisionTypesOptions = createLoadOptions(getCollisionTypesAction);
  const loadLightStatusesOptions = createLoadOptions(getLightStatusesAction);
  const loadRoadSituationsOptions = createLoadOptions(getRoadSituationsAction);
  const loadRoadDefectsOptions = createLoadOptions(getRoadDefectsAction);
  const loadAirStatusesOptions = createLoadOptions(getAirStatusesAction);
  const loadAreaUsagesOptions = createLoadOptions(getAreaUsagesAction);
  const loadHumanReasonsOptions = createLoadOptions(getHumanReasonsAction);
  const loadVehicleReasonsOptions = createLoadOptions(getVehicleReasonsAction);
  const loadVehicleSystemsOptions = createLoadOptions(getVehicleSystemsAction);
  const loadFaultStatusesOptions = createLoadOptions(getFaultStatusesAction);
  const loadPlaqueTypesOptions = createLoadOptions(getPlaqueTypesAction);
  const loadColorsOptions = createLoadOptions(getColorsAction);

  // Watch province and city for cascading
  const watchedProvince = useWatch({ control, name: "province" });
  const watchedCity = useWatch({ control, name: "city" });

  // Cascade version – dependent selects reload when province/city changes
  const [cascadeVersion, setCascadeVersion] = useState(0);
  const prevProvinceRef = useRef(watchedProvince);
  const prevCityRef = useRef(watchedCity);

  useEffect(() => {
    const provinceChanged =
      JSON.stringify(prevProvinceRef.current) !== JSON.stringify(watchedProvince);
    const cityChanged = JSON.stringify(prevCityRef.current) !== JSON.stringify(watchedCity);
    if (provinceChanged || cityChanged) {
      setCascadeVersion((v) => v + 1);
      if (provinceChanged) prevProvinceRef.current = watchedProvince;
      if (cityChanged) prevCityRef.current = watchedCity;
    }
  }, [watchedProvince, watchedCity]);

  // Key suffix with cascade version
  const gK = (key: string) => `${key}-g-${globalFiltersVersion}`;
  const cK = (key: string) => `${key}-g-${globalFiltersVersion}-cv-${cascadeVersion}`;

  // Province name → ID cache (fetched once, ~31 provinces)
  const provinceNameToIdMap = useRef<Record<string, string>>({});

  const buildProvinceIds = useCallback(async (): Promise<string[]> => {
    if (!watchedProvince || watchedProvince.length === 0) return [];
    if (Object.keys(provinceNameToIdMap.current).length === 0) {
      try {
        const response = await getProvincesAction({
          set: { limit: 50, page: 1 },
          get: { _id: 1, name: 1 },
        });
        if (response.success) {
          const map: Record<string, string> = {};
          response.body.forEach((p: { _id: string; name: string }) => {
            map[p.name] = p._id;
          });
          provinceNameToIdMap.current = map;
        }
      } catch {
        return [];
      }
    }
    return watchedProvince
      .map((name: string) => provinceNameToIdMap.current[name])
      .filter(Boolean);
  }, [watchedProvince]);

  // Load cities filtered by selected province(s)
  const loadCitiesFiltered = useCallback(
    async (inputValue?: string): Promise<SelectOption[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const setParams: any = { limit: 20, page: 1 };
      if (inputValue) setParams.name = inputValue;

      const provinceIds = await buildProvinceIds();
      if (provinceIds.length > 0) setParams.provinceIds = provinceIds;

      try {
        const response = await getCitiesAction({
          set: setParams as ReqType["main"]["city"]["gets"]["set"],
          get: { _id: 1, name: 1 },
        });
        if (response.success) {
          return response.body.map((item: { _id: string; name: string }) => ({
            value: item.name,
            label: item.name,
          }));
        }
      } catch {
        // ignore
      }
      return [];
    },
    [buildProvinceIds],
  );

  // Load roads filtered by province(s) – NEW: provinceIds on road/gets
  const loadRoadsFiltered = useCallback(
    async (inputValue?: string): Promise<SelectOption[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const setParams: any = { limit: 20, page: 1 };
      if (inputValue) setParams.name = inputValue;

      const provinceIds = await buildProvinceIds();
      if (provinceIds.length > 0) setParams.provinceIds = provinceIds;

      try {
        const response = await getRoadsAction({
          set: setParams as ReqType["main"]["road"]["gets"]["set"],
          get: { _id: 1, name: 1 },
        });
        if (response.success) {
          return response.body.map((item: { _id: string; name: string }) => ({
            value: item.name,
            label: item.name,
          }));
        }
      } catch {
        // ignore
      }
      return [];
    },
    [buildProvinceIds],
  );

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Sync form when global filters change from outside
  useEffect(() => {
    if (hasGlobalFilters) {
      Object.entries(globalFilters).forEach(([key, value]) => {
        setValue(key as keyof ChartFilterState, value as never);
      });
    }
  }, [globalFiltersVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const toSelectOptions = (values?: string[]): SelectOption[] | undefined => {
    if (!values || values.length === 0) return undefined;
    return values.map((v) => ({ value: v, label: v }));
  };

  const handleSaveGlobal = (data: ChartFilterState) => {
    const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          acc[key as keyof ChartFilterState] = value as never;
        }
      } else if (value !== undefined && value !== null && value !== "") {
        acc[key as keyof ChartFilterState] = value as never;
      }
      return acc;
    }, {} as ChartFilterState);
    setGlobalFilters(cleanedData);
    setIsOpen(false);
  };

  const handleClearGlobal = () => {
    clearGlobalFilters();
    reset({});
  };

  const globalDefaultValue = (key: keyof ChartFilterState) => {
    return hasGlobalFilters ? toSelectOptions(globalFilters[key] as string[] | undefined) : undefined;
  };

  return (
    <>
      {/* FAB Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 left-6 z-[10000] flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 ${
          hasGlobalFilters
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
            : "bg-gradient-to-r from-gray-700 to-gray-800 text-white"
        }`}
        title={isOpen ? "بستن فیلترهای عمومی" : "فیلترهای عمومی"}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
        {hasGlobalFilters && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-md">
            {globalFilterCount}
          </span>
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[10001] transition-all duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-2xl z-[10002] transition-all duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: "22rem", direction: "rtl" }}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-l from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">فیلترهای عمومی</h2>
              <p className="text-xs text-gray-500 mt-0.5">در تمام صفحات اعمال می‌شود</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Active Global Badge */}
        {hasGlobalFilters && (
          <div className="mx-5 mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-blue-800 font-medium">{globalFilterCount} فیلتر عمومی فعال است</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(handleSaveGlobal)} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Basic Filters */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">فیلترهای اصلی</h3>

            <div className="grid grid-cols-1 gap-4 mb-4">
              <MyDateInput key={gK("dateOfAccidentFrom")} name="dateOfAccidentFrom" label="تاریخ شروع تصادف" control={control} errMsg={errors.dateOfAccidentFrom?.message} placeholder="از تاریخ" portalZIndex={20000} />
              <MyDateInput key={gK("dateOfAccidentTo")} name="dateOfAccidentTo" label="تاریخ پایان تصادف" control={control} errMsg={errors.dateOfAccidentTo?.message} placeholder="تا تاریخ" portalZIndex={20000} />
            </div>

            <div className="grid grid-cols-1 gap-4 mb-4">
              <MyAsyncMultiSelect key={gK("province")} name="province" label="استان" setValue={setValue} loadOptions={loadProvincesOptions} errMsg={errors.province?.message} placeholder="انتخاب استان..." defaultOptions defaultValue={globalDefaultValue("province") as SelectOption[]} />
              <MyAsyncMultiSelect key={cK("city")} name="city" label="شهر" setValue={setValue} loadOptions={loadCitiesFiltered} errMsg={errors.city?.message} placeholder="انتخاب شهر..." defaultOptions defaultValue={globalDefaultValue("city") as SelectOption[]} />
              <MyAsyncMultiSelect key={cK("road")} name="road" label="راه" setValue={setValue} loadOptions={loadRoadsFiltered} errMsg={errors.road?.message} placeholder="انتخاب راه..." defaultOptions defaultValue={globalDefaultValue("road") as SelectOption[]} />
              <MyAsyncMultiSelect key={gK("collisionType")} name="collisionType" label="نوع برخورد" setValue={setValue} loadOptions={loadCollisionTypesOptions} errMsg={errors.collisionType?.message} placeholder="انتخاب نوع برخورد..." defaultOptions defaultValue={globalDefaultValue("collisionType") as SelectOption[]} />
              <MyAsyncMultiSelect key={gK("accidentType")} name="accidentType" label="نوع تصادف" setValue={setValue} loadOptions={loadAccidentTypesOptions} errMsg={errors.accidentType?.message} placeholder="انتخاب نوع تصادف..." defaultOptions defaultValue={globalDefaultValue("accidentType") as SelectOption[]} />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <MyInput key={gK("deadCountMin")} name="deadCountMin" label="حداقل فوتی" register={control.register} errMsg={errors.deadCountMin?.message} type="number" placeholder="0" />
              <MyInput key={gK("deadCountMax")} name="deadCountMax" label="حداکثر فوتی" register={control.register} errMsg={errors.deadCountMax?.message} type="number" placeholder="حداکثر..." />
              <MyInput key={gK("injuredCountMin")} name="injuredCountMin" label="حداقل مجروح" register={control.register} errMsg={errors.injuredCountMin?.message} type="number" placeholder="0" />
              <MyInput key={gK("injuredCountMax")} name="injuredCountMax" label="حداکثر مجروح" register={control.register} errMsg={errors.injuredCountMax?.message} type="number" placeholder="حداکثر..." />
            </div>

            <MyInput key={gK("officer")} name="officer" label="افسر مسئول" register={control.register} errMsg={errors.officer?.message} type="text" placeholder="نام افسر..." />
          </div>

          {/* Advanced Toggle */}
          <button
            type="button"
            onClick={() => setAdvancedFiltersOpen(!advancedFiltersOpen)}
            className="flex items-center justify-between w-full text-sm font-semibold text-gray-800 bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:text-blue-600 transition-colors"
          >
            <span>فیلترهای پیشرفته</span>
            <svg className={`w-5 h-5 transform transition-transform ${advancedFiltersOpen ? "rotate-180" : ""}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {advancedFiltersOpen && (
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 space-y-4">
              <h4 className="text-sm font-medium text-gray-800 border-b border-gray-200 pb-2">شرایط راه و محیط</h4>
              <MyAsyncMultiSelect key={gK("lightStatus")} name="lightStatus" label="وضعیت روشنایی" setValue={setValue} loadOptions={loadLightStatusesOptions} errMsg={errors.lightStatus?.message} placeholder="انتخاب..." defaultOptions defaultValue={globalDefaultValue("lightStatus") as SelectOption[]} />
              <MyAsyncMultiSelect key={gK("roadSituation")} name="roadSituation" label="وضعیت راه" setValue={setValue} loadOptions={loadRoadSituationsOptions} errMsg={errors.roadSituation?.message} placeholder="انتخاب..." defaultOptions defaultValue={globalDefaultValue("roadSituation") as SelectOption[]} />
              <MyAsyncMultiSelect key={gK("roadDefects")} name="roadDefects" label="نقایص راه" setValue={setValue} loadOptions={loadRoadDefectsOptions} errMsg={errors.roadDefects?.message} placeholder="انتخاب..." defaultOptions defaultValue={globalDefaultValue("roadDefects") as SelectOption[]} />
              <MyAsyncMultiSelect key={gK("airStatuses")} name="airStatuses" label="وضعیت جوی" setValue={setValue} loadOptions={loadAirStatusesOptions} errMsg={errors.airStatuses?.message} placeholder="انتخاب..." defaultOptions defaultValue={globalDefaultValue("airStatuses") as SelectOption[]} />
              <MyAsyncMultiSelect key={gK("areaUsages")} name="areaUsages" label="کاربری منطقه" setValue={setValue} loadOptions={loadAreaUsagesOptions} errMsg={errors.areaUsages?.message} placeholder="انتخاب..." defaultOptions defaultValue={globalDefaultValue("areaUsages") as SelectOption[]} />
              <MyAsyncMultiSelect key={gK("humanReasons")} name="humanReasons" label="علل انسانی" setValue={setValue} loadOptions={loadHumanReasonsOptions} errMsg={errors.humanReasons?.message} placeholder="انتخاب..." defaultOptions defaultValue={globalDefaultValue("humanReasons") as SelectOption[]} />
              <MyAsyncMultiSelect key={gK("vehicleReasons")} name="vehicleReasons" label="علل وسیله نقلیه" setValue={setValue} loadOptions={loadVehicleReasonsOptions} errMsg={errors.vehicleReasons?.message} placeholder="انتخاب..." defaultOptions defaultValue={globalDefaultValue("vehicleReasons") as SelectOption[]} />

              <h4 className="text-sm font-medium text-gray-800 border-b border-gray-200 pb-2">وسیله نقلیه</h4>
              <MyAsyncMultiSelect key={gK("vehicleSystem")} name="vehicleSystem" label="سیستم وسیله" setValue={setValue} loadOptions={loadVehicleSystemsOptions} errMsg={errors.vehicleSystem?.message} placeholder="انتخاب..." defaultOptions defaultValue={globalDefaultValue("vehicleSystem") as SelectOption[]} />
              <MyAsyncMultiSelect key={gK("vehicleColor")} name="vehicleColor" label="رنگ" setValue={setValue} loadOptions={loadColorsOptions} errMsg={errors.vehicleColor?.message} placeholder="انتخاب..." defaultOptions defaultValue={globalDefaultValue("vehicleColor") as SelectOption[]} />
              <MyAsyncMultiSelect key={gK("vehiclePlaqueType")} name="vehiclePlaqueType" label="نوع پلاک" setValue={setValue} loadOptions={loadPlaqueTypesOptions} errMsg={errors.vehiclePlaqueType?.message} placeholder="انتخاب..." defaultOptions defaultValue={globalDefaultValue("vehiclePlaqueType") as SelectOption[]} />
              <MyAsyncMultiSelect key={gK("vehicleFaultStatus")} name="vehicleFaultStatus" label="وضعیت خطا" setValue={setValue} loadOptions={loadFaultStatusesOptions} errMsg={errors.vehicleFaultStatus?.message} placeholder="انتخاب..." defaultOptions defaultValue={globalDefaultValue("vehicleFaultStatus") as SelectOption[]} />
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                ذخیره به عنوان فیلتر عمومی
              </span>
            </button>
            <button
              type="button"
              onClick={handleClearGlobal}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors border border-gray-200"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                پاک کردن فیلترهای عمومی
              </span>
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
