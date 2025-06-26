/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { gets as getAreaUsagesAction } from "@/app/actions/area_usage/gets";
import { gets as getAirStatusesAction } from "@/app/actions/air_status/gets";
import { gets as getRoadDefectsAction } from "@/app/actions/road_defect/gets";
import { gets as getHumanReasonsAction } from "@/app/actions/human_reason/gets";
import { gets as getVehicleReasonsAction } from "@/app/actions/vehicle_reason/gets";
import { gets as getEquipmentDamagesAction } from "@/app/actions/equipment_damage/gets";
import { gets as getRoadSurfaceConditionsAction } from "@/app/actions/road_surface_condition/gets";
import { gets as getMaxDamageSectionsAction } from "@/app/actions/max_damage_section/gets";
import { gets as getCitiesAction } from "@/app/actions/city/gets";
import { gets as getProvincesAction } from "@/app/actions/province/gets";
import { gets as getCityZonesAction } from "@/app/actions/city_zone/gets";
import { gets as getTrafficZonesAction } from "@/app/actions/traffic_zone/gets";
import { gets as getRoadsAction } from "@/app/actions/road/gets";
import { gets as getRoadRepairTypesAction } from "@/app/actions/road_repair_type/gets";
import { gets as getRoadSituationsAction } from "@/app/actions/road_situation/gets";
import { gets as getPositionsAction } from "@/app/actions/position/gets";
import { gets as getColorsAction } from "@/app/actions/color/gets";
import { gets as getPlaqueTypesAction } from "@/app/actions/plaque_type/gets";
import { gets as getPlaqueUsagesAction } from "@/app/actions/plaque_usage/gets";
import { gets as getLicenceTypesAction } from "@/app/actions/licence_type/gets";
import { gets as getTypesAction } from "@/app/actions/type/gets";
import { gets as getLightStatusesAction } from "@/app/actions/light_status/gets";
import { gets as getShoulderStatusesAction } from "@/app/actions/shoulder_status/gets";
import { gets as getCollisionTypesAction } from "@/app/actions/collision_type/gets";
import { gets as getMotionDirectionsAction } from "@/app/actions/motion_direction/gets";
import { gets as getInsuranceCosAction } from "@/app/actions/insurance_co/gets";
import { gets as getBodyInsuranceCosAction } from "@/app/actions/body_insurance_co/gets";
import { gets as getFaultStatusesAction } from "@/app/actions/fault_status/gets";
import { gets as getRulingTypesAction } from "@/app/actions/ruling_type/gets";
import { gets as getSystemsAction } from "@/app/actions/system/gets";
import { gets as getSystemTypesAction } from "@/app/actions/system_type/gets";
import MyInput from "../atoms/MyInput";
import MyDateInput from "../atoms/MyDateInput";
import MyAsyncMultiSelect, { SelectOption } from "../atoms/MyAsyncMultiSelect";
import { DeepPartial, ReqType } from "@/types/declarations/selectInp";
import { DefaultSearchArrayValues } from "@/utils/prepareAccidentSearch";
import { arrayKeys, numericKeys } from "@/utils/keys";

export type AdvencedArticleSearchParams =
  ReqType["main"]["accident"]["gets"]["set"];

interface AdvancedSearchProps {
  isOpen: boolean;
  defaultSearchArrayValues: DefaultSearchArrayValues;
  pageAddress?: string;
  compact?: boolean;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  isOpen,
  defaultSearchArrayValues,
  pageAddress,
  compact = false,
}) => {
  const router = useRouter();
  const currentSearchParams = useSearchParams();

  const initialFormValues: DeepPartial<AdvencedArticleSearchParams> = React.useMemo(() => {
    const params: DeepPartial<AdvencedArticleSearchParams> = {};
    for (const [key, value] of currentSearchParams.entries()) {

      if (arrayKeys.includes(key)) {
        if (value) {
          const formValue = defaultSearchArrayValues[key as keyof DefaultSearchArrayValues]?.filter(opt => value.split(',').includes(opt.value));
          if (formValue) {
            params[key as keyof AdvencedArticleSearchParams] = formValue.map(fv => fv.value) as any;
          } else {
            params[key as keyof AdvencedArticleSearchParams] = value.split(',') as any;
          }
        }
      } else if (numericKeys.includes(key)) {
        if (value) {
          params[key as keyof AdvencedArticleSearchParams] = +value as any;
        }
      } else if (value) {
        params[key as keyof AdvencedArticleSearchParams] = value as any;
      }
    }
    return params;
  }, [currentSearchParams, defaultSearchArrayValues]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<AdvencedArticleSearchParams>({
    defaultValues: initialFormValues,
  });

  const createLoadOptions = (
    action: (args: any) => Promise<{success: boolean, body: any[]} | null | undefined>
  ) => async (inputValue?: string): Promise<SelectOption[]> => {
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

  const loadAreaUsagesOptions = createLoadOptions(getAreaUsagesAction);
  const loadAirStatusesOptions = createLoadOptions(getAirStatusesAction);
  const loadRoadDefectsOptions = createLoadOptions(getRoadDefectsAction);
  const loadHumanReasonsOptions = createLoadOptions(getHumanReasonsAction);
  const loadVehicleReasonsOptions = createLoadOptions(getVehicleReasonsAction);
  const loadEquipmentDamagesOptions = createLoadOptions(getEquipmentDamagesAction);
  const loadRoadSurfaceConditionsOptions = createLoadOptions(getRoadSurfaceConditionsAction);
  const loadMaxDamageSectionsOptions = createLoadOptions(getMaxDamageSectionsAction);
  const loadCitiesOptions = createLoadOptions(getCitiesAction);
  const loadProvincesOptions = createLoadOptions(getProvincesAction);
  const loadCityZonesOptions = createLoadOptions(getCityZonesAction);
  const loadTrafficZonesOptions = createLoadOptions(getTrafficZonesAction);
  const loadRoadsOptions = createLoadOptions(getRoadsAction);
  const loadRoadRepairTypesOptions = createLoadOptions(getRoadRepairTypesAction);
  const loadRoadSituationsOptions = createLoadOptions(getRoadSituationsAction);
  const loadPositionsOptions = createLoadOptions(getPositionsAction);
  const loadColorsOptions = createLoadOptions(getColorsAction);
  const loadPlaqueTypesOptions = createLoadOptions(getPlaqueTypesAction);
  const loadPlaqueUsagesOptions = createLoadOptions(getPlaqueUsagesAction);
  const loadLicenceTypesOptions = createLoadOptions(getLicenceTypesAction);
  const loadTypesOptions = createLoadOptions(getTypesAction);
  const loadLightStatusesOptions = createLoadOptions(getLightStatusesAction);
  const loadShoulderStatusesOptions = createLoadOptions(getShoulderStatusesAction);
  const loadCollisionTypesOptions = createLoadOptions(getCollisionTypesAction);
  const loadMotionDirectionsOptions = createLoadOptions(getMotionDirectionsAction);
  const loadInsuranceCosOptions = createLoadOptions(getInsuranceCosAction);
  const loadBodyInsuranceCosOptions = createLoadOptions(getBodyInsuranceCosAction);
  const loadFaultStatusesOptions = createLoadOptions(getFaultStatusesAction);
  const loadRulingTypesOptions = createLoadOptions(getRulingTypesAction);
  const loadSystemsOptions = createLoadOptions(getSystemsAction);
  const loadSystemTypesOptions = createLoadOptions(getSystemTypesAction);

  const onSubmit: SubmitHandler<AdvencedArticleSearchParams> = (criteria) => {
    const queryString = Object.entries(criteria)
      .filter((filterArr) => {
        const value = filterArr[1];
        if (Array.isArray(value)) return value.length > 0;
        return value !== undefined && value !== null && value.toString().trim() !== "";
      })
      .map(([key, value]) =>
        Array.isArray(value)
          ? `${encodeURIComponent(key)}=${encodeURIComponent(value.join(","))}`
          : `${encodeURIComponent(key)}=${encodeURIComponent(value as string | number | boolean)}`
      )
      .join("&");

    const newRoute = pageAddress
      ? `${pageAddress}${queryString ? `/?${queryString}` : ""}`
      : `${queryString ? `/?${queryString}` : "/"}`;
    router.push(newRoute);
  };

  return (
    <div
      className={`transition-all duration-500 ease-in-out overflow-hidden ${
        isOpen
          ? "h-auto opacity-100 translate-y-0"
          : "h-0 opacity-0 -translate-y-4 pointer-events-none"
      }`}
    >
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg mt-6">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={`${compact ? 'p-4 space-y-6' : 'p-8 space-y-10'}`}
        >
          {/* Header */}
          <header className="border-b border-slate-200 pb-6">
            <h2 className="text-2xl font-bold text-slate-800 text-right mb-2">
              جستجوی پیشرفته تصادفات
            </h2>
            <p className="text-slate-600 text-right text-sm">
              با استفاده از فیلترهای زیر، جستجوی دقیق و تخصصی خود را انجام دهید
            </p>
          </header>

          {/* Multi-Select Filters Section */}
          <section className={`bg-slate-50/50 rounded-xl border border-slate-100 ${compact ? 'p-4' : 'p-8'}`}>
            <div className={`flex items-center gap-3 ${compact ? 'mb-4' : 'mb-8'}`}>
              <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
              <h3 className="text-xl font-semibold text-slate-800">
                فیلترهای دسته‌بندی (چند انتخابی)
              </h3>
            </div>

            <div className={`grid ${compact ? 'gap-4 grid-cols-1' : 'gap-8 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'}`}>
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="areaUsages"
                label="نوع کاربری منطقه"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.areaUsages}
                loadOptions={loadAreaUsagesOptions}
                errMsg={errors.areaUsages?.message}
                defaultOptions
              />
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="airStatuses"
                label="وضعیت جوی"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.airStatuses}
                loadOptions={loadAirStatusesOptions}
                errMsg={errors.airStatuses?.message}
                defaultOptions
              />
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="roadDefects"
                label="نواقص راه"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.roadDefects}
                loadOptions={loadRoadDefectsOptions}
                errMsg={errors.roadDefects?.message}
                defaultOptions
              />
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="humanReasons"
                label="علل انسانی تصادف"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.humanReasons}
                loadOptions={loadHumanReasonsOptions}
                errMsg={errors.humanReasons?.message}
                defaultOptions
              />
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="vehicleReasons"
                label="علل وسیله نقلیه"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.vehicleReasons}
                loadOptions={loadVehicleReasonsOptions}
                errMsg={errors.vehicleReasons?.message}
                defaultOptions
              />
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="equipmentDamages"
                label="خسارات تجهیزات"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.equipmentDamages}
                loadOptions={loadEquipmentDamagesOptions}
                errMsg={errors.equipmentDamages?.message}
                defaultOptions
              />
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="roadSurfaceConditions"
                label="وضعیت سطح راه"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.roadSurfaceConditions}
                loadOptions={loadRoadSurfaceConditionsOptions}
                errMsg={errors.roadSurfaceConditions?.message}
                defaultOptions
              />
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="vehicleMaxDamageSections"
                label="محل اصلی خسارت خودرو"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.vehicleMaxDamageSections}
                loadOptions={loadMaxDamageSectionsOptions}
                errMsg={errors.vehicleMaxDamageSections?.message}
                defaultOptions
              />
            </div>
          </section>

          {/* Core Accident Details Section */}
          <section className={`bg-white rounded-xl border border-slate-200 shadow-sm ${compact ? 'p-4' : 'p-8'}`}>
            <div className={`flex items-center gap-3 ${compact ? 'mb-4' : 'mb-8'}`}>
              <div className="w-1 h-6 bg-emerald-600 rounded-full"></div>
              <h3 className="text-xl font-semibold text-slate-800">
                جزئیات اصلی تصادف
              </h3>
            </div>

            <div className={`grid gap-6 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
              <MyInput className="!w-full !p-0" name="seri" label="سری تصادف" placeholder="شماره سری" register={register} errMsg={errors.seri?.message} type="number" />
              <MyInput className="!w-full !p-0" name="serial" label="سریال داخلی" placeholder="شماره سریال داخلی" register={register} errMsg={errors.serial?.message} type="number" />
              <MyDateInput className="!w-full !p-0" name="dateOfAccidentFrom" label="تاریخ تصادف (از)" control={control} errMsg={errors.dateOfAccidentFrom?.message} placeholder="از تاریخ (مثال: 1403/01/01)" />
              <MyDateInput className="!w-full !p-0" name="dateOfAccidentTo" label="تاریخ تصادف (تا)" control={control} errMsg={errors.dateOfAccidentTo?.message} placeholder="تا تاریخ (مثال: 1403/12/29)" />
              <MyInput className="!w-full !p-0" name="deadCount" label="تعداد فوتی" placeholder="تعداد دقیق" register={register} errMsg={errors.deadCount?.message} type="number" />
              <MyInput className="!w-full !p-0" name="deadCountMin" label="حداقل فوتی" placeholder="حداقل تعداد" register={register} errMsg={errors.deadCountMin?.message} type="number" />
              <MyInput className="!w-full !p-0" name="deadCountMax" label="حداکثر فوتی" placeholder="حداکثر تعداد" register={register} errMsg={errors.deadCountMax?.message} type="number" />
              <MyInput className="!w-full !p-0" name="injuredCount" label="تعداد مجروح" placeholder="تعداد دقیق" register={register} errMsg={errors.injuredCount?.message} type="number" />
              <MyInput className="!w-full !p-0" name="injuredCountMin" label="حداقل مجروح" placeholder="حداقل تعداد" register={register} errMsg={errors.injuredCountMin?.message} type="number" />
              <MyInput className="!w-full !p-0" name="injuredCountMax" label="حداکثر مجروح" placeholder="حداکثر تعداد" register={register} errMsg={errors.injuredCountMax?.message} type="number" />
              <MyInput className="!w-full !p-0" name="hasWitness" label="دارای شاهد" placeholder="true / false" register={register} errMsg={errors.hasWitness?.message} />
              <MyInput className="!w-full !p-0" name="newsNumber" label="شماره خبر" placeholder="شماره خبرنامه" register={register} errMsg={errors.newsNumber?.message} type="number" />
              <MyInput className="!w-full !p-0" name="officer" label="افسر رسیدگی کننده" placeholder="نام یا کد افسر" register={register} errMsg={errors.officer?.message} />
              <MyDateInput className="!w-full !p-0" name="completionDateFrom" label="تاریخ تکمیل (از)" control={control} errMsg={errors.completionDateFrom?.message} placeholder="از تاریخ تکمیل پرونده" />
              <MyDateInput className="!w-full !p-0" name="completionDateTo" label="تاریخ تکمیل (تا)" control={control} errMsg={errors.completionDateTo?.message} placeholder="تا تاریخ تکمیل پرونده" />
            </div>
          </section>

          {/* Location & Context Section */}
          <section className={`bg-slate-50/50 rounded-xl border border-slate-100 ${compact ? 'p-4' : 'p-8'}`}>
            <div className={`flex items-center gap-3 ${compact ? 'mb-4' : 'mb-8'}`}>
              <div className="w-1 h-6 bg-amber-600 rounded-full"></div>
              <h3 className="text-xl font-semibold text-slate-800">
                موقعیت و شرایط مکانی/زمانی
              </h3>
            </div>

            <div className={`grid gap-6 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="province"
                label="استان"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.province}
                loadOptions={loadProvincesOptions}
                errMsg={errors.province?.message}
                defaultOptions
              />
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="city"
                label="شهر"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.city}
                loadOptions={loadCitiesOptions}
                errMsg={errors.city?.message}
                defaultOptions
              />
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="road"
                label="جاده/خیابان"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.road}
                loadOptions={loadRoadsOptions}
                errMsg={errors.road?.message}
                defaultOptions
              />
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="trafficZone"
                label="محدوده ترافیکی"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.trafficZone}
                loadOptions={loadTrafficZonesOptions}
                errMsg={errors.trafficZone?.message}
                defaultOptions
              />
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="cityZone"
                label="منطقه شهری"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.cityZone}
                loadOptions={loadCityZonesOptions}
                errMsg={errors.cityZone?.message}
                defaultOptions
              />
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="accidentType"
                label="نوع حادثه"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.accidentType}
                loadOptions={loadTypesOptions}
                errMsg={errors.accidentType?.message}
                defaultOptions
              />
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="position"
                label="موقعیت ثبت کننده"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.position}
                loadOptions={loadPositionsOptions}
                errMsg={errors.position?.message}
                defaultOptions
              />
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="rulingType"
                label="نوع رای"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.rulingType}
                loadOptions={loadRulingTypesOptions}
                errMsg={errors.rulingType?.message}
                defaultOptions
              />
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="lightStatus"
                label="وضعیت روشنایی"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.lightStatus}
                loadOptions={loadLightStatusesOptions}
                errMsg={errors.lightStatus?.message}
                defaultOptions
              />
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="collisionType"
                label="نوع برخورد"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.collisionType}
                loadOptions={loadCollisionTypesOptions}
                errMsg={errors.collisionType?.message}
                defaultOptions
              />
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="roadSituation"
                label="وضعیت راه"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.roadSituation}
                loadOptions={loadRoadSituationsOptions}
                errMsg={errors.roadSituation?.message}
                defaultOptions
              />
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="roadRepairType"
                label="نوع تعمیرات راه"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.roadRepairType}
                loadOptions={loadRoadRepairTypesOptions}
                errMsg={errors.roadRepairType?.message}
                defaultOptions
              />
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="shoulderStatus"
                label="وضعیت شانه راه"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.shoulderStatus}
                loadOptions={loadShoulderStatusesOptions}
                errMsg={errors.shoulderStatus?.message}
                defaultOptions
              />
            </div>
          </section>

          {/* Attachments Section */}
          <section className={`bg-white rounded-xl border border-slate-200 shadow-sm ${compact ? 'p-4' : 'p-8'}`}>
            <div className={`flex items-center gap-3 ${compact ? 'mb-4' : 'mb-8'}`}>
              <div className="w-1 h-6 bg-purple-600 rounded-full"></div>
              <h3 className="text-xl font-semibold text-slate-800">
                فایل‌های ضمیمه
              </h3>
            </div>

            <div className={`grid gap-6 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
              <MyInput className="!w-full !p-0" name="attachmentName" label="نام فایل ضمیمه" placeholder="بخشی از نام فایل" register={register} errMsg={errors.attachmentName?.message} />
              <MyInput className="!w-full !p-0" name="attachmentType" label="نوع فایل ضمیمه" placeholder="مثلا image/jpeg" register={register} errMsg={errors.attachmentType?.message} />
            </div>
          </section>

          {/* Vehicle Details Section */}
          <section className={`bg-slate-50/50 rounded-xl border border-slate-100 ${compact ? 'p-4' : 'p-8'}`}>
            <div className={`flex items-center gap-3 ${compact ? 'mb-4' : 'mb-8'}`}>
              <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
              <h3 className="text-xl font-semibold text-slate-800">
                جزئیات وسیله نقلیه
              </h3>
            </div>

            <div className={`grid gap-6 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="vehicleColor"
                label="رنگ خودرو"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.vehicleColor}
                loadOptions={loadColorsOptions}
                errMsg={errors.vehicleColor?.message}
                defaultOptions
              />
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="vehicleSystem"
                label="سیستم خودرو"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.vehicleSystem}
                loadOptions={loadSystemsOptions}
                errMsg={errors.vehicleSystem?.message}
                defaultOptions
              />
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="vehiclePlaqueType"
                label="نوع پلاک خودرو"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.vehiclePlaqueType}
                loadOptions={loadPlaqueTypesOptions}
                errMsg={errors.vehiclePlaqueType?.message}
                defaultOptions
              />
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="vehicleSystemType"
                label="تیپ خودرو"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.vehicleSystemType}
                loadOptions={loadSystemTypesOptions}
                errMsg={errors.vehicleSystemType?.message}
                defaultOptions
              />
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="vehicleFaultStatus"
                label="وضعیت تقصیر خودرو"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.vehicleFaultStatus}
                loadOptions={loadFaultStatusesOptions}
                errMsg={errors.vehicleFaultStatus?.message}
                defaultOptions
              />
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="vehicleInsuranceCo"
                label="شرکت بیمه خودرو"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.vehicleInsuranceCo}
                loadOptions={loadInsuranceCosOptions}
                errMsg={errors.vehicleInsuranceCo?.message}
                defaultOptions
              />
              <MyInput className="!w-full !p-0" name="vehicleInsuranceNo" label="شماره بیمه‌نامه خودرو" placeholder="شماره بیمه‌نامه" register={register} errMsg={errors.vehicleInsuranceNo?.message} />
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="vehiclePlaqueUsage"
                label="کاربری پلاک خودرو"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.vehiclePlaqueUsage}
                loadOptions={loadPlaqueUsagesOptions}
                errMsg={errors.vehiclePlaqueUsage?.message}
                defaultOptions
              />
              <MyInput className="!w-full !p-0" name="vehiclePrintNumber" label="شماره چاپ پلاک" placeholder="شماره چاپ" register={register} errMsg={errors.vehiclePrintNumber?.message} />
              <MyInput className="!w-full !p-0" name="vehiclePlaqueSerialElement" label="سریال پلاک (بخشی از)" placeholder="یک بخش از سریال پلاک" register={register} errMsg={errors.vehiclePlaqueSerialElement?.message} />
              <MyDateInput className="!w-full !p-0" name="vehicleInsuranceDateFrom" label="تاریخ بیمه (از)" control={control} errMsg={errors.vehicleInsuranceDateFrom?.message} placeholder="از تاریخ صدور بیمه" />
              <MyDateInput className="!w-full !p-0" name="vehicleInsuranceDateTo" label="تاریخ بیمه (تا)" control={control} errMsg={errors.vehicleInsuranceDateTo?.message} placeholder="تا تاریخ انقضای بیمه" />
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="vehicleBodyInsuranceCo"
                label="شرکت بیمه بدنه"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.vehicleBodyInsuranceCo}
                loadOptions={loadBodyInsuranceCosOptions}
                errMsg={errors.vehicleBodyInsuranceCo?.message}
                defaultOptions
              />
              <MyInput className="!w-full !p-0" name="vehicleBodyInsuranceNo" label="شماره بیمه بدنه" placeholder="شماره بیمه بدنه" register={register} errMsg={errors.vehicleBodyInsuranceNo?.message} />
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="vehicleMotionDirection"
                label="جهت حرکت خودرو"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.vehicleMotionDirection}
                loadOptions={loadMotionDirectionsOptions}
                errMsg={errors.vehicleMotionDirection?.message}
                defaultOptions
              />
              <MyDateInput className="!w-full !p-0" name="vehicleBodyInsuranceDateFrom" label="تاریخ بیمه بدنه (از)" control={control} errMsg={errors.vehicleBodyInsuranceDateFrom?.message} placeholder="از تاریخ صدور بیمه بدنه" />
              <MyDateInput className="!w-full !p-0" name="vehicleBodyInsuranceDateTo" label="تاریخ بیمه بدنه (تا)" control={control} errMsg={errors.vehicleBodyInsuranceDateTo?.message} placeholder="تا تاریخ انقضای بیمه بدنه" />
              <MyInput className="!w-full !p-0" name="vehicleDamageSectionOther" label="سایر خسارات خودرو" placeholder="توضیح خسارت" register={register} errMsg={errors.vehicleDamageSectionOther?.message} />
              <MyInput className="!w-full !p-0" name="vehicleInsuranceWarrantyLimit" label="سقف تعهد بیمه" placeholder="مبلغ دقیق" register={register} errMsg={errors.vehicleInsuranceWarrantyLimit?.message} type="number" />
              <MyInput className="!w-full !p-0" name="vehicleInsuranceWarrantyLimitMin" label="حداقل سقف تعهد" placeholder="حداقل مبلغ" register={register} errMsg={errors.vehicleInsuranceWarrantyLimitMin?.message} type="number" />
              <MyInput className="!w-full !p-0" name="vehicleInsuranceWarrantyLimitMax" label="حداکثر سقف تعهد" placeholder="حداکثر مبلغ" register={register} errMsg={errors.vehicleInsuranceWarrantyLimitMax?.message} type="number" />
            </div>
          </section>

          {/* Driver Details Section */}
          <section className={`bg-white rounded-xl border border-slate-200 shadow-sm ${compact ? 'p-4' : 'p-8'}`}>
            <div className={`flex items-center gap-3 ${compact ? 'mb-4' : 'mb-8'}`}>
              <div className="w-1 h-6 bg-rose-600 rounded-full"></div>
              <h3 className="text-xl font-semibold text-slate-800">
                جزئیات راننده
              </h3>
            </div>

            <div className={`grid gap-6 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
              <MyInput className="!w-full !p-0" name="driverSex" label="جنسیت راننده" placeholder="Male / Female" register={register} errMsg={errors.driverSex?.message} />
              <MyInput className="!w-full !p-0" name="driverFirstName" label="نام راننده" placeholder="نام" register={register} errMsg={errors.driverFirstName?.message} />
              <MyInput className="!w-full !p-0" name="driverLastName" label="نام خانوادگی راننده" placeholder="نام خانوادگی" register={register} errMsg={errors.driverLastName?.message} />
              <MyInput className="!w-full !p-0" name="driverNationalCode" label="کد ملی راننده" placeholder="کد ملی" register={register} errMsg={errors.driverNationalCode?.message} />
              <MyInput className="!w-full !p-0" name="driverLicenceNumber" label="شماره گواهینامه" placeholder="شماره گواهینامه" register={register} errMsg={errors.driverLicenceNumber?.message} />
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="driverLicenceType"
                label="نوع گواهینامه"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.driverLicenceType}
                loadOptions={loadLicenceTypesOptions}
                errMsg={errors.driverLicenceType?.message}
                defaultOptions
              />
              <MyInput className="!w-full !p-0" name="driverInjuryType" label="نوع مصدومیت راننده" placeholder="مثلا جزیی" register={register} errMsg={errors.driverInjuryType?.message} />
              <MyInput className="!w-full !p-0" name="driverTotalReason" label="علت کلی تخلف راننده" placeholder="علت تخلف" register={register} errMsg={errors.driverTotalReason?.message} />
            </div>
          </section>

          {/* Passenger Details Section */}
          <section className={`bg-slate-50/50 rounded-xl border border-slate-100 ${compact ? 'p-4' : 'p-8'}`}>
            <div className={`flex items-center gap-3 ${compact ? 'mb-4' : 'mb-8'}`}>
              <div className="w-1 h-6 bg-teal-600 rounded-full"></div>
              <h3 className="text-xl font-semibold text-slate-800">
                جزئیات سرنشین
              </h3>
            </div>

            <div className={`grid gap-6 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
              <MyInput className="!w-full !p-0" name="passengerSex" label="جنسیت سرنشین" placeholder="Male / Female" register={register} errMsg={errors.passengerSex?.message} />
              <MyInput className="!w-full !p-0" name="passengerFirstName" label="نام سرنشین" placeholder="نام" register={register} errMsg={errors.passengerFirstName?.message} />
              <MyInput className="!w-full !p-0" name="passengerLastName" label="نام خانوادگی سرنشین" placeholder="نام خانوادگی" register={register} errMsg={errors.passengerLastName?.message} />
              <MyInput className="!w-full !p-0" name="passengerNationalCode" label="کد ملی سرنشین" placeholder="کد ملی" register={register} errMsg={errors.passengerNationalCode?.message} />
              <MyInput className="!w-full !p-0" name="passengerInjuryType" label="نوع مصدومیت سرنشین" placeholder="مثلا جزیی" register={register} errMsg={errors.passengerInjuryType?.message} />
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="passengerFaultStatus"
                label="وضعیت تقصیر سرنشین"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.passengerFaultStatus}
                loadOptions={loadFaultStatusesOptions}
                errMsg={errors.passengerFaultStatus?.message}
                defaultOptions
              />
              <MyInput className="!w-full !p-0" name="passengerTotalReason" label="علت کلی برای سرنشین" placeholder="علت مرتبط" register={register} errMsg={errors.passengerTotalReason?.message} />
            </div>
          </section>

          {/* Pedestrian Details Section */}
          <section className={`bg-white rounded-xl border border-slate-200 shadow-sm ${compact ? 'p-4' : 'p-8'}`}>
            <div className={`flex items-center gap-3 ${compact ? 'mb-4' : 'mb-8'}`}>
              <div className="w-1 h-6 bg-orange-600 rounded-full"></div>
              <h3 className="text-xl font-semibold text-slate-800">
                جزئیات عابر پیاده
              </h3>
            </div>

            <div className={`grid gap-6 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
              <MyInput className="!w-full !p-0" name="pedestrianSex" label="جنسیت عابر" placeholder="Male / Female" register={register} errMsg={errors.pedestrianSex?.message} />
              <MyInput className="!w-full !p-0" name="pedestrianFirstName" label="نام عابر" placeholder="نام" register={register} errMsg={errors.pedestrianFirstName?.message} />
              <MyInput className="!w-full !p-0" name="pedestrianLastName" label="نام خانوادگی عابر" placeholder="نام خانوادگی" register={register} errMsg={errors.pedestrianLastName?.message} />
              <MyInput className="!w-full !p-0" name="pedestrianNationalCode" label="کد ملی عابر" placeholder="کد ملی" register={register} errMsg={errors.pedestrianNationalCode?.message} />
              <MyInput className="!w-full !p-0" name="pedestrianInjuryType" label="نوع مصدومیت عابر" placeholder="مثلا جزیی" register={register} errMsg={errors.pedestrianInjuryType?.message} />
              <MyAsyncMultiSelect
                className="!w-full !p-0"
                name="pedestrianFaultStatus"
                label="وضعیت تقصیر عابر"
                setValue={setValue}
                defaultValue={defaultSearchArrayValues.pedestrianFaultStatus}
                loadOptions={loadFaultStatusesOptions}
                errMsg={errors.pedestrianFaultStatus?.message}
                defaultOptions
              />
              <MyInput className="!w-full !p-0" name="pedestrianTotalReason" label="علت کلی برای عابر" placeholder="علت مرتبط" register={register} errMsg={errors.pedestrianTotalReason?.message} />
            </div>
          </section>

          {/* Pagination Controls Section */}
          <section className={`bg-slate-50/50 rounded-xl border border-slate-100 ${compact ? 'p-4' : 'p-8'}`}>
            <div className={`flex items-center gap-3 ${compact ? 'mb-4' : 'mb-8'}`}>
              <div className="w-1 h-6 bg-slate-600 rounded-full"></div>
              <h3 className="text-xl font-semibold text-slate-800">
                تنظیمات صفحه‌بندی
              </h3>
            </div>

            <div className={`grid gap-6 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
              <MyInput className="!w-full !p-0" name="page" type="number" label="شماره صفحه" placeholder="شماره صفحه" register={register} errMsg={errors.page?.message} />
              <MyInput className="!w-full !p-0" name="limit" type="number" label="تعداد در صفحه" placeholder="تعداد در هر صفحه" register={register} errMsg={errors.limit?.message} />
            </div>
          </section>

          {/* Submit Button */}
          <footer className={`flex flex-col justify-between items-center gap-4 border-t border-slate-200 ${compact ? 'pt-4 sm:flex-col' : 'pt-8 sm:flex-row gap-6'}`}>
            {!compact && (
              <div className="flex-1 text-right">
                <p className="text-sm text-slate-600">
                  تمامی فیلترهای انتخاب شده در جستجو اعمال خواهند شد
                </p>
              </div>
            )}
            <div className={`flex ${compact ? 'flex-col w-full gap-2' : 'gap-4'}`}>
              <button
                type="button"
                onClick={() => router.push(pageAddress || "/")}
                className={`text-slate-600 bg-white border border-slate-300 rounded-xl font-medium hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 ${compact ? 'px-4 py-2 text-sm' : 'px-6 py-3'}`}
              >
                پاک کردن فیلترها
              </button>
              <button
                type="submit"
                className={`bg-gradient-to-l from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${compact ? 'px-4 py-2 text-sm' : 'px-8 py-3'}`}
              >
                اعمال فیلترها و جستجو
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default AdvancedSearch;
