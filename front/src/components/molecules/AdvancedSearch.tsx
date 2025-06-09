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
import MyInput from "../atoms/MyInput";
import MyAsyncMultiSelect, { SelectOption } from "../atoms/MyAsyncMultiSelect";
import { DeepPartial, ReqType } from "@/types/declarations/selectInp";
import { DefaultSearchArrayValues } from "@/utils/prepareAccidentSearch";

export type AdvencedArticleSearchParams =
  ReqType["main"]["accident"]["gets"]["set"];

const AdvancedSearch: React.FC<{
  isOpen: boolean;
  defaultSearchArrayValues: DefaultSearchArrayValues;
  pageAddress?: string;
}> = ({
  isOpen,
  defaultSearchArrayValues,
  pageAddress,
}) => {
    const router = useRouter();
    const currentSearchParams = useSearchParams();

    const initialFormValues: DeepPartial<AdvencedArticleSearchParams> = React.useMemo(() => {
      const params: DeepPartial<AdvencedArticleSearchParams> = {};
      for (const [key, value] of currentSearchParams.entries()) {
        const arrayKeys = ['areaUsages', 'airStatuses', 'roadDefects', 'humanReasons', 'vehicleReasons', 'equipmentDamages', 'roadSurfaceConditions', 'vehicleMaxDamageSections'];
        const numericKeys = ['page', 'limit', 'seri', 'serial', 'deadCount', 'deadCountMin', 'deadCountMax', 'injuredCount', 'injuredCountMin', 'injuredCountMax', 'newsNumber', 'vehicleInsuranceWarrantyLimit', 'vehicleInsuranceWarrantyLimitMin', 'vehicleInsuranceWarrantyLimitMax'];

        if (arrayKeys.includes(key)) {
          if (value) {
            // Ensure the value for RHF is an array of strings (IDs) if MyAsyncMultiSelect expects that for setValue
            // Or, if MyAsyncMultiSelect expects SelectOption[], adjust here or ensure defaultSearchArrayValues is used effectively
            // For now, assuming MyAsyncMultiSelect's setValue will get an array of IDs, and defaultValue (SelectOption[]) helps it display labels.
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
      // control, // Control is removed as per request
      formState: { errors },
    } = useForm<AdvencedArticleSearchParams>({
      defaultValues: initialFormValues,
    });

    const createLoadOptions = (
      action: (args: any) => Promise<any[] | null | undefined>
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
        if (response && Array.isArray(response)) {
          return response.map((item: { _id: string; name: string }) => ({
            value: item._id,
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
        className={`transition-all duration-500 ease-in-out bg-white border rounded-lg shadow-lg max-h-auto mt-4 ${isOpen ? "opacity-100" : "max-h-0 opacity-0 pointer-events-none"
          }`}
        style={{ overflow: isOpen ? 'visible' : 'hidden' }}
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 bg-gray-50 p-6 rounded-lg shadow-inner"
        >
          <h3 className="text-2xl font-bold text-gray-800 text-right mb-6 border-b pb-3">
            جستجوی پیشرفته تصادفات
          </h3>

          {/* --- Section: Multi-Select Filters --- */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-700 mb-4 text-right">
              فیلترهای اصلی (چند انتخابی)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MyAsyncMultiSelect className="w-full" name="areaUsages" label="نوع کاربری منطقه" setValue={setValue} defaultValue={defaultSearchArrayValues.areaUsages} loadOptions={loadAreaUsagesOptions} errMsg={errors.areaUsages?.message} defaultOptions />
              <MyAsyncMultiSelect className="w-full" name="airStatuses" label="وضعیت جوی" setValue={setValue} defaultValue={defaultSearchArrayValues.airStatuses} loadOptions={loadAirStatusesOptions} errMsg={errors.airStatuses?.message} defaultOptions />
              <MyAsyncMultiSelect className="w-full" name="roadDefects" label="نواقص راه" setValue={setValue} defaultValue={defaultSearchArrayValues.roadDefects} loadOptions={loadRoadDefectsOptions} errMsg={errors.roadDefects?.message} defaultOptions />
              <MyAsyncMultiSelect className="w-full" name="humanReasons" label="علل انسانی تصادف" setValue={setValue} defaultValue={defaultSearchArrayValues.humanReasons} loadOptions={loadHumanReasonsOptions} errMsg={errors.humanReasons?.message} defaultOptions />
              <MyAsyncMultiSelect className="w-full" name="vehicleReasons" label="علل وسیله نقلیه" setValue={setValue} defaultValue={defaultSearchArrayValues.vehicleReasons} loadOptions={loadVehicleReasonsOptions} errMsg={errors.vehicleReasons?.message} defaultOptions />
              <MyAsyncMultiSelect className="w-full" name="equipmentDamages" label="خسارات تجهیزات" setValue={setValue} defaultValue={defaultSearchArrayValues.equipmentDamages} loadOptions={loadEquipmentDamagesOptions} errMsg={errors.equipmentDamages?.message} defaultOptions />
              <MyAsyncMultiSelect className="w-full" name="roadSurfaceConditions" label="وضعیت سطح راه" setValue={setValue} defaultValue={defaultSearchArrayValues.roadSurfaceConditions} loadOptions={loadRoadSurfaceConditionsOptions} errMsg={errors.roadSurfaceConditions?.message} defaultOptions />
              <MyAsyncMultiSelect className="w-full" name="vehicleMaxDamageSections" label="محل اصلی خسارت خودرو" setValue={setValue} defaultValue={defaultSearchArrayValues.vehicleMaxDamageSections} loadOptions={loadMaxDamageSectionsOptions} errMsg={errors.vehicleMaxDamageSections?.message} defaultOptions />
            </div>
          </div>

          {/* --- Section: Core Accident Details --- */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-700 mb-4 text-right">
              جزئیات اصلی تصادف
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MyInput name="seri" label="سری تصادف" placeholder="شماره سری" register={register} errMsg={errors.seri?.message} type="number" />
              <MyInput name="serial" label="سریال داخلی" placeholder="شماره سریال داخلی" register={register} errMsg={errors.serial?.message} type="number" />
              <MyInput name="dateOfAccidentFrom" label="تاریخ تصادف (از)" register={register} errMsg={errors.dateOfAccidentFrom?.message} type="date" />
              <MyInput name="dateOfAccidentTo" label="تاریخ تصادف (تا)" register={register} errMsg={errors.dateOfAccidentTo?.message} type="date" />
              <MyInput name="deadCount" label="تعداد فوتی" placeholder="تعداد دقیق" register={register} errMsg={errors.deadCount?.message} type="number" />
              <MyInput name="deadCountMin" label="حداقل فوتی" placeholder="حداقل تعداد" register={register} errMsg={errors.deadCountMin?.message} type="number" />
              <MyInput name="deadCountMax" label="حداکثر فوتی" placeholder="حداکثر تعداد" register={register} errMsg={errors.deadCountMax?.message} type="number" />
              <MyInput name="injuredCount" label="تعداد مجروح" placeholder="تعداد دقیق" register={register} errMsg={errors.injuredCount?.message} type="number" />
              <MyInput name="injuredCountMin" label="حداقل مجروح" placeholder="حداقل تعداد" register={register} errMsg={errors.injuredCountMin?.message} type="number" />
              <MyInput name="injuredCountMax" label="حداکثر مجروح" placeholder="حداکثر تعداد" register={register} errMsg={errors.injuredCountMax?.message} type="number" />
              <MyInput name="hasWitness" label="دارای شاهد" placeholder="true / false" register={register} errMsg={errors.hasWitness?.message} />
              <MyInput name="newsNumber" label="شماره خبر" placeholder="شماره خبرنامه" register={register} errMsg={errors.newsNumber?.message} type="number" />
              <MyInput name="officer" label="افسر رسیدگی کننده" placeholder="نام یا کد افسر" register={register} errMsg={errors.officer?.message} />
              <MyInput name="completionDateFrom" label="تاریخ تکمیل (از)" register={register} errMsg={errors.completionDateFrom?.message} type="date" />
              <MyInput name="completionDateTo" label="تاریخ تکمیل (تا)" register={register} errMsg={errors.completionDateTo?.message} type="date" />
            </div>
          </div>

          {/* --- Section: Location & Context --- */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-700 mb-4 text-right">
              موقعیت و شرایط مکانی/زمانی
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MyInput name="province" label="استان" placeholder="نام استان" register={register} errMsg={errors.province?.message} />
              <MyInput name="city" label="شهر" placeholder="نام شهر" register={register} errMsg={errors.city?.message} />
              <MyInput name="road" label="جاده/خیابان" placeholder="نام جاده یا خیابان" register={register} errMsg={errors.road?.message} />
              <MyInput name="trafficZone" label="محدوده ترافیکی" placeholder="نام محدوده" register={register} errMsg={errors.trafficZone?.message} />
              <MyInput name="cityZone" label="منطقه شهری" placeholder="نام منطقه" register={register} errMsg={errors.cityZone?.message} />
              <MyInput name="accidentType" label="نوع حادثه" placeholder="نوع حادثه" register={register} errMsg={errors.accidentType?.message} />
              <MyInput name="position" label="موقعیت ثبت کننده" placeholder="موقعیت شغلی" register={register} errMsg={errors.position?.message} />
              <MyInput name="rulingType" label="نوع رای" placeholder="نوع رای صادره" register={register} errMsg={errors.rulingType?.message} />
              <MyInput name="lightStatus" label="وضعیت روشنایی" placeholder="مثلا روز، شب" register={register} errMsg={errors.lightStatus?.message} />
              <MyInput name="collisionType" label="نوع برخورد" placeholder="مثلا شاخ به شاخ" register={register} errMsg={errors.collisionType?.message} />
              <MyInput name="roadSituation" label="وضعیت راه" placeholder="مثلا خشک، لغزنده" register={register} errMsg={errors.roadSituation?.message} />
              <MyInput name="roadRepairType" label="نوع تعمیرات راه" placeholder="نوع تعمیرات" register={register} errMsg={errors.roadRepairType?.message} />
              <MyInput name="shoulderStatus" label="وضعیت شانه راه" placeholder="وضعیت شانه" register={register} errMsg={errors.shoulderStatus?.message} />
            </div>
          </div>

          {/* --- Section: Attachments --- */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-700 mb-4 text-right">
              فایل‌های ضمیمه
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MyInput name="attachmentName" label="نام فایل ضمیمه" placeholder="بخشی از نام فایل" register={register} errMsg={errors.attachmentName?.message} />
              <MyInput name="attachmentType" label="نوع فایل ضمیمه" placeholder="مثلا image/jpeg" register={register} errMsg={errors.attachmentType?.message} />
            </div>
          </div>

          {/* --- Section: Vehicle Details --- */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-700 mb-4 text-right">
              جزئیات وسیله نقلیه (هر یک از وسایل)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MyInput name="vehicleColor" label="رنگ خودرو" placeholder="نام رنگ" register={register} errMsg={errors.vehicleColor?.message} />
              <MyInput name="vehicleSystem" label="سیستم خودرو" placeholder="مثلا سواری" register={register} errMsg={errors.vehicleSystem?.message} />
              <MyInput name="vehiclePlaqueType" label="نوع پلاک خودرو" placeholder="مثلا شخصی" register={register} errMsg={errors.vehiclePlaqueType?.message} />
              <MyInput name="vehicleSystemType" label="تیپ خودرو" placeholder="مثلا سدان" register={register} errMsg={errors.vehicleSystemType?.message} />
              <MyInput name="vehicleFaultStatus" label="وضعیت تقصیر خودرو" placeholder="مثلا مقصر" register={register} errMsg={errors.vehicleFaultStatus?.message} />
              <MyInput name="vehicleInsuranceCo" label="شرکت بیمه خودرو" placeholder="نام شرکت بیمه" register={register} errMsg={errors.vehicleInsuranceCo?.message} />
              <MyInput name="vehicleInsuranceNo" label="شماره بیمه‌نامه خودرو" placeholder="شماره بیمه‌نامه" register={register} errMsg={errors.vehicleInsuranceNo?.message} />
              <MyInput name="vehiclePlaqueUsage" label="کاربری پلاک خودرو" placeholder="مثلا شخصی" register={register} errMsg={errors.vehiclePlaqueUsage?.message} />
              <MyInput name="vehiclePrintNumber" label="شماره چاپ پلاک" placeholder="شماره چاپ" register={register} errMsg={errors.vehiclePrintNumber?.message} />
              <MyInput name="vehiclePlaqueSerialElement" label=" سریال پلاک (بخشی از)" placeholder="یک بخش از سریال پلاک" register={register} errMsg={errors.vehiclePlaqueSerialElement?.message} />
              <MyInput name="vehicleInsuranceDateFrom" label="تاریخ بیمه (از)" register={register} errMsg={errors.vehicleInsuranceDateFrom?.message} type="date" />
              <MyInput name="vehicleInsuranceDateTo" label="تاریخ بیمه (تا)" register={register} errMsg={errors.vehicleInsuranceDateTo?.message} type="date" />
              <MyInput name="vehicleBodyInsuranceCo" label="شرکت بیمه بدنه" placeholder="نام شرکت بیمه بدنه" register={register} errMsg={errors.vehicleBodyInsuranceCo?.message} />
              <MyInput name="vehicleBodyInsuranceNo" label="شماره بیمه بدنه" placeholder="شماره بیمه بدنه" register={register} errMsg={errors.vehicleBodyInsuranceNo?.message} />
              <MyInput name="vehicleMotionDirection" label="جهت حرکت خودرو" placeholder="مثلا شمال به جنوب" register={register} errMsg={errors.vehicleMotionDirection?.message} />
              <MyInput name="vehicleBodyInsuranceDateFrom" label="تاریخ بیمه بدنه (از)" register={register} errMsg={errors.vehicleBodyInsuranceDateFrom?.message} type="date" />
              <MyInput name="vehicleBodyInsuranceDateTo" label="تاریخ بیمه بدنه (تا)" register={register} errMsg={errors.vehicleBodyInsuranceDateTo?.message} type="date" />
              <MyInput name="vehicleDamageSectionOther" label="سایر خسارات خودرو" placeholder="توضیح خسارت" register={register} errMsg={errors.vehicleDamageSectionOther?.message} />
              <MyInput name="vehicleInsuranceWarrantyLimit" label="سقف تعهد بیمه" placeholder="مبلغ دقیق" register={register} errMsg={errors.vehicleInsuranceWarrantyLimit?.message} type="number" />
              <MyInput name="vehicleInsuranceWarrantyLimitMin" label="حداقل سقف تعهد" placeholder="حداقل مبلغ" register={register} errMsg={errors.vehicleInsuranceWarrantyLimitMin?.message} type="number" />
              <MyInput name="vehicleInsuranceWarrantyLimitMax" label="حداکثر سقف تعهد" placeholder="حداکثر مبلغ" register={register} errMsg={errors.vehicleInsuranceWarrantyLimitMax?.message} type="number" />
            </div>
          </div>

          {/* --- Section: Driver Details --- */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-700 mb-4 text-right">
              جزئیات راننده (هر یک از رانندگان)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MyInput name="driverSex" label="جنسیت راننده" placeholder="Male / Female" register={register} errMsg={errors.driverSex?.message} />
              <MyInput name="driverFirstName" label="نام راننده" placeholder="نام" register={register} errMsg={errors.driverFirstName?.message} />
              <MyInput name="driverLastName" label="نام خانوادگی راننده" placeholder="نام خانوادگی" register={register} errMsg={errors.driverLastName?.message} />
              <MyInput name="driverNationalCode" label="کد ملی راننده" placeholder="کد ملی" register={register} errMsg={errors.driverNationalCode?.message} />
              <MyInput name="driverLicenceNumber" label="شماره گواهینامه" placeholder="شماره گواهینامه" register={register} errMsg={errors.driverLicenceNumber?.message} />
              <MyInput name="driverLicenceType" label="نوع گواهینامه" placeholder="مثلا پایه دو" register={register} errMsg={errors.driverLicenceType?.message} />
              <MyInput name="driverInjuryType" label="نوع مصدومیت راننده" placeholder="مثلا جزیی" register={register} errMsg={errors.driverInjuryType?.message} />
              <MyInput name="driverTotalReason" label="علت کلی تخلف راننده" placeholder="علت تخلف" register={register} errMsg={errors.driverTotalReason?.message} />
            </div>
          </div>

          {/* --- Section: Passenger Details --- */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-700 mb-4 text-right">
              جزئیات سرنشین (هر یک از سرنشینان)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MyInput name="passengerSex" label="جنسیت سرنشین" placeholder="Male / Female" register={register} errMsg={errors.passengerSex?.message} />
              <MyInput name="passengerFirstName" label="نام سرنشین" placeholder="نام" register={register} errMsg={errors.passengerFirstName?.message} />
              <MyInput name="passengerLastName" label="نام خانوادگی سرنشین" placeholder="نام خانوادگی" register={register} errMsg={errors.passengerLastName?.message} />
              <MyInput name="passengerNationalCode" label="کد ملی سرنشین" placeholder="کد ملی" register={register} errMsg={errors.passengerNationalCode?.message} />
              <MyInput name="passengerInjuryType" label="نوع مصدومیت سرنشین" placeholder="مثلا جزیی" register={register} errMsg={errors.passengerInjuryType?.message} />
              <MyInput name="passengerFaultStatus" label="وضعیت تقصیر سرنشین" placeholder="وضعیت تقصیر" register={register} errMsg={errors.passengerFaultStatus?.message} />
              <MyInput name="passengerTotalReason" label="علت کلی برای سرنشین" placeholder="علت مرتبط" register={register} errMsg={errors.passengerTotalReason?.message} />
            </div>
          </div>

          {/* --- Section: Pedestrian Details --- */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-700 mb-4 text-right">
              جزئیات عابر پیاده (هر یک از عابرین)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MyInput name="pedestrianSex" label="جنسیت عابر" placeholder="Male / Female" register={register} errMsg={errors.pedestrianSex?.message} />
              <MyInput name="pedestrianFirstName" label="نام عابر" placeholder="نام" register={register} errMsg={errors.pedestrianFirstName?.message} />
              <MyInput name="pedestrianLastName" label="نام خانوادگی عابر" placeholder="نام خانوادگی" register={register} errMsg={errors.pedestrianLastName?.message} />
              <MyInput name="pedestrianNationalCode" label="کد ملی عابر" placeholder="کد ملی" register={register} errMsg={errors.pedestrianNationalCode?.message} />
              <MyInput name="pedestrianInjuryType" label="نوع مصدومیت عابر" placeholder="مثلا جزیی" register={register} errMsg={errors.pedestrianInjuryType?.message} />
              <MyInput name="pedestrianFaultStatus" label="وضعیت تقصیر عابر" placeholder="وضعیت تقصیر" register={register} errMsg={errors.pedestrianFaultStatus?.message} />
              <MyInput name="pedestrianTotalReason" label="علت کلی برای عابر" placeholder="علت مرتبط" register={register} errMsg={errors.pedestrianTotalReason?.message} />
            </div>
          </div>

          {/* --- Section: Pagination Controls --- */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-700 mb-4 text-right">
              تنظیمات صفحه‌بندی
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MyInput name="page" type="number" label="شماره صفحه" placeholder="شماره صفحه" register={register} errMsg={errors.page?.message} />
              <MyInput name="limit" type="number" label="تعداد در صفحه" placeholder="تعداد در هر صفحه" register={register} errMsg={errors.limit?.message} />
            </div>
          </div>

          {/* --- Submit Button --- */}
          <div className="flex justify-end items-center pt-6 border-t border-gray-200">
            <button
              type="submit"
              className="w-full md:w-auto px-8 h-12 bg-gradient-to-r from-blue-500 to-blue-700 text-white text-base font-semibold rounded-lg shadow-md hover:from-blue-600 hover:to-blue-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              اعمال فیلترها و جستجو
            </button>
          </div>
        </form>
      </div>
    );
  };

export default AdvancedSearch;
