/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useForm, type SubmitHandler } from "react-hook-form";
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
import { gets as getTownshipsAction } from "@/app/actions/township/gets";
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

import MyInput from "@/components/atoms/MyInput";
import MyDateInput from "@/components/atoms/MyDateInput";
import MyAsyncMultiSelect, {
  type SelectOption,
} from "@/components/atoms/MyAsyncMultiSelect";
import { useScrollLock } from "@/hooks/useScrollLock";
import {
  CITY_ZONE_OPTION_LIMIT,
  sortCityZoneOptions,
} from "@/utils/cityZoneOptions";
import {
  ACCIDENT_ARRAY_FILTER_KEYS,
  ACCIDENT_FILTER_IGNORED_KEYS,
  ACCIDENT_FILTER_TABS,
  ACCIDENT_NUMERIC_FILTER_KEYS,
  type AccidentFilterTabId,
  type AccidentSearchParams,
} from "@/utils/accidentFilters";
import type { DeepPartial } from "@/types/declarations/selectInp";

type FieldName = keyof AccidentSearchParams;

type LoadOptions = (inputValue?: string) => Promise<SelectOption[]>;

type FieldConfig =
  | {
      kind: "input";
      name: FieldName;
      label: string;
      placeholder: string;
      type?: string;
    }
  | { kind: "date"; name: FieldName; label: string; placeholder: string }
  | {
      kind: "select";
      name: FieldName;
      label: string;
      placeholder?: string;
    }
  | {
      kind: "plain";
      name: FieldName;
      label: string;
      options: { value: string; label: string }[];
    };

interface SectionConfig {
  title?: string;
  description?: string;
  fields: FieldConfig[];
}

const SEX_OPTIONS = [
  { value: "Male", label: "مرد" },
  { value: "Female", label: "زن" },
  { value: "Other", label: "سایر" },
];

const WITNESS_OPTIONS = [
  { value: "true", label: "دارد" },
  { value: "false", label: "ندارد" },
];

const TAB_CONTENT: Record<AccidentFilterTabId, SectionConfig[]> = {
  essentials: [
    {
      title: "شناسه و زمان",
      description: "با شماره پرونده یا بازه تاریخی، تصادف مورد نظر را پیدا کنید.",
      fields: [
        { kind: "input", name: "seri", label: "سری تصادف", placeholder: "شماره سری", type: "number" },
        { kind: "input", name: "serial", label: "سریال داخلی", placeholder: "شماره سریال داخلی", type: "number" },
        { kind: "date", name: "dateOfAccidentFrom", label: "تاریخ تصادف (از)", placeholder: "از تاریخ تصادف" },
        { kind: "date", name: "dateOfAccidentTo", label: "تاریخ تصادف (تا)", placeholder: "تا تاریخ تصادف" },
        { kind: "date", name: "completionDateFrom", label: "تاریخ تکمیل (از)", placeholder: "از تاریخ تکمیل" },
        { kind: "date", name: "completionDateTo", label: "تاریخ تکمیل (تا)", placeholder: "تا تاریخ تکمیل" },
      ],
    },
    {
      title: "تلفات و شاهد",
      description: "شدت حادثه را بر اساس تعداد فوتی، مجروح و وجود شاهد محدود کنید.",
      fields: [
        { kind: "input", name: "deadCount", label: "تعداد فوتی", placeholder: "تعداد دقیق", type: "number" },
        { kind: "input", name: "deadCountMin", label: "حداقل فوتی", placeholder: "حداقل تعداد", type: "number" },
        { kind: "input", name: "deadCountMax", label: "حداکثر فوتی", placeholder: "حداکثر تعداد", type: "number" },
        { kind: "input", name: "injuredCount", label: "تعداد مجروح", placeholder: "تعداد دقیق", type: "number" },
        { kind: "input", name: "injuredCountMin", label: "حداقل مجروح", placeholder: "حداقل تعداد", type: "number" },
        { kind: "input", name: "injuredCountMax", label: "حداکثر مجروح", placeholder: "حداکثر تعداد", type: "number" },
        { kind: "plain", name: "hasWitness", label: "وجود شاهد", options: WITNESS_OPTIONS },
        { kind: "input", name: "newsNumber", label: "شماره خبر", placeholder: "شماره خبرنامه", type: "number" },
        { kind: "input", name: "officer", label: "افسر رسیدگی‌کننده", placeholder: "نام یا کد افسر" },
      ],
    },
    {
      title: "فایل ضمیمه",
      description: "بر اساس نام یا نوع فایل پیوست جستجو کنید.",
      fields: [
        { kind: "input", name: "attachmentName", label: "نام فایل ضمیمه", placeholder: "بخشی از نام فایل" },
        { kind: "input", name: "attachmentType", label: "نوع فایل ضمیمه", placeholder: "مثلاً image/jpeg" },
      ],
    },
  ],
  location: [
    {
      title: "موقعیت جغرافیایی",
      description: "استان، شهر، شهرستان و محدوده‌های ثبت‌شده را انتخاب کنید.",
      fields: [
        { kind: "select", name: "province", label: "استان" },
        { kind: "select", name: "city", label: "شهر" },
        { kind: "select", name: "township", label: "شهرستان" },
        { kind: "select", name: "road", label: "جاده / خیابان" },
        { kind: "select", name: "trafficZone", label: "محدوده ترافیکی" },
        { kind: "select", name: "cityZone", label: "منطقه شهری" },
        { kind: "select", name: "position", label: "موقعیت ثبت‌کننده" },
      ],
    },
  ],
  conditions: [
    {
      title: "عوامل محیطی",
      description: "شرایط جوی، کاربری منطقه و علل مؤثر در حادثه.",
      fields: [
        { kind: "select", name: "areaUsages", label: "کاربری منطقه" },
        { kind: "select", name: "airStatuses", label: "وضعیت جوی" },
        { kind: "select", name: "roadDefects", label: "نقایص راه" },
        { kind: "select", name: "humanReasons", label: "علل انسانی" },
        { kind: "select", name: "vehicleReasons", label: "علل وسیله نقلیه" },
        { kind: "select", name: "equipmentDamages", label: "خسارت تجهیزات" },
        { kind: "select", name: "roadSurfaceConditions", label: "وضعیت سطح راه" },
      ],
    },
    {
      title: "شرایط راه و برخورد",
      description: "نوع راه، روشنایی، خط‌کشی و نوع برخورد را مشخص کنید.",
      fields: [
        { kind: "select", name: "accidentType", label: "نوع حادثه" },
        { kind: "select", name: "rulingType", label: "وضعیت خط‌کشی" },
        { kind: "select", name: "lightStatus", label: "وضعیت روشنایی" },
        { kind: "select", name: "collisionType", label: "نوع برخورد" },
        { kind: "select", name: "roadSituation", label: "نوع راه" },
        { kind: "select", name: "roadRepairType", label: "نوع تعمیرات راه" },
        { kind: "select", name: "shoulderStatus", label: "وضعیت شانه راه" },
        { kind: "select", name: "vehicleMaxDamageSections", label: "محل اصلی خسارت خودرو" },
      ],
    },
  ],
  vehicle: [
    {
      title: "مشخصات خودرو",
      description: "خودرو را با رنگ، سیستم، پلاک و وضعیت تقصیر محدود کنید.",
      fields: [
        { kind: "select", name: "vehicleColor", label: "رنگ خودرو" },
        { kind: "select", name: "vehicleSystem", label: "سیستم خودرو" },
        { kind: "select", name: "vehiclePlaqueType", label: "نوع پلاک" },
        { kind: "select", name: "vehicleSystemType", label: "تیپ خودرو" },
        { kind: "select", name: "vehicleFaultStatus", label: "وضعیت تقصیر خودرو" },
        { kind: "select", name: "vehiclePlaqueUsage", label: "کاربری پلاک" },
        { kind: "select", name: "vehicleMotionDirection", label: "جهت حرکت" },
        { kind: "input", name: "vehiclePrintNumber", label: "شماره چاپ پلاک", placeholder: "شماره چاپ" },
        { kind: "input", name: "vehiclePlaqueSerialElement", label: "سریال پلاک", placeholder: "بخشی از سریال پلاک" },
        { kind: "input", name: "vehicleDamageSectionOther", label: "سایر خسارات", placeholder: "توضیح خسارت" },
      ],
    },
    {
      title: "بیمه شخص ثالث",
      fields: [
        { kind: "select", name: "vehicleInsuranceCo", label: "شرکت بیمه" },
        { kind: "input", name: "vehicleInsuranceNo", label: "شماره بیمه‌نامه", placeholder: "شماره بیمه‌نامه" },
        { kind: "date", name: "vehicleInsuranceDateFrom", label: "تاریخ بیمه (از)", placeholder: "از تاریخ صدور" },
        { kind: "date", name: "vehicleInsuranceDateTo", label: "تاریخ بیمه (تا)", placeholder: "تا تاریخ انقضا" },
        { kind: "input", name: "vehicleInsuranceWarrantyLimit", label: "سقف تعهد", placeholder: "مبلغ دقیق", type: "number" },
        { kind: "input", name: "vehicleInsuranceWarrantyLimitMin", label: "حداقل سقف تعهد", placeholder: "حداقل مبلغ", type: "number" },
        { kind: "input", name: "vehicleInsuranceWarrantyLimitMax", label: "حداکثر سقف تعهد", placeholder: "حداکثر مبلغ", type: "number" },
      ],
    },
    {
      title: "بیمه بدنه",
      fields: [
        { kind: "select", name: "vehicleBodyInsuranceCo", label: "شرکت بیمه بدنه" },
        { kind: "input", name: "vehicleBodyInsuranceNo", label: "شماره بیمه بدنه", placeholder: "شماره بیمه بدنه" },
        { kind: "date", name: "vehicleBodyInsuranceDateFrom", label: "تاریخ بیمه بدنه (از)", placeholder: "از تاریخ صدور" },
        { kind: "date", name: "vehicleBodyInsuranceDateTo", label: "تاریخ بیمه بدنه (تا)", placeholder: "تا تاریخ انقضا" },
      ],
    },
  ],
  people: [
    {
      title: "راننده",
      fields: [
        { kind: "plain", name: "driverSex", label: "جنسیت", options: SEX_OPTIONS },
        { kind: "input", name: "driverFirstName", label: "نام", placeholder: "نام راننده" },
        { kind: "input", name: "driverLastName", label: "نام خانوادگی", placeholder: "نام خانوادگی راننده" },
        { kind: "input", name: "driverNationalCode", label: "کد ملی", placeholder: "کد ملی راننده" },
        { kind: "input", name: "driverLicenceNumber", label: "شماره گواهینامه", placeholder: "شماره گواهینامه" },
        { kind: "select", name: "driverLicenceType", label: "نوع گواهینامه" },
        { kind: "input", name: "driverInjuryType", label: "نوع مصدومیت", placeholder: "مثلاً جزئی" },
        { kind: "input", name: "driverTotalReason", label: "علت تخلف", placeholder: "علت تخلف راننده" },
      ],
    },
    {
      title: "سرنشین",
      fields: [
        { kind: "plain", name: "passengerSex", label: "جنسیت", options: SEX_OPTIONS },
        { kind: "input", name: "passengerFirstName", label: "نام", placeholder: "نام سرنشین" },
        { kind: "input", name: "passengerLastName", label: "نام خانوادگی", placeholder: "نام خانوادگی سرنشین" },
        { kind: "input", name: "passengerNationalCode", label: "کد ملی", placeholder: "کد ملی سرنشین" },
        { kind: "input", name: "passengerInjuryType", label: "نوع مصدومیت", placeholder: "مثلاً جزئی" },
        { kind: "select", name: "passengerFaultStatus", label: "وضعیت تقصیر" },
        { kind: "input", name: "passengerTotalReason", label: "علت تخلف", placeholder: "علت مرتبط" },
      ],
    },
    {
      title: "عابر پیاده",
      fields: [
        { kind: "plain", name: "pedestrianSex", label: "جنسیت", options: SEX_OPTIONS },
        { kind: "input", name: "pedestrianFirstName", label: "نام", placeholder: "نام عابر" },
        { kind: "input", name: "pedestrianLastName", label: "نام خانوادگی", placeholder: "نام خانوادگی عابر" },
        { kind: "input", name: "pedestrianNationalCode", label: "کد ملی", placeholder: "کد ملی عابر" },
        { kind: "input", name: "pedestrianInjuryType", label: "نوع مصدومیت", placeholder: "مثلاً جزئی" },
        { kind: "select", name: "pedestrianFaultStatus", label: "وضعیت تقصیر" },
        { kind: "input", name: "pedestrianTotalReason", label: "علت تخلف", placeholder: "علت مرتبط" },
      ],
    },
  ],
};

const TAB_ICONS: Record<AccidentFilterTabId, React.ReactNode> = {
  essentials: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h6l6 6v11a2 2 0 01-2 2z"
    />
  ),
  location: (
    <>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </>
  ),
  conditions: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414m12.728 0l-1.414-1.414M7.05 7.05L5.636 5.636M16 12a4 4 0 11-8 0 4 4 0 018 0z"
    />
  ),
  vehicle: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M5 17h14M6 17l-1.5-5.5A2 2 0 016.5 9h11a2 2 0 012 2.5L18 17M7 17a1.5 1.5 0 11-3 0m16 0a1.5 1.5 0 11-3 0M7 9l1-3h8l1 3"
    />
  ),
  people: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M17 20h5v-1a4 4 0 00-4-4h-1M9 20H4v-1a4 4 0 014-4h2m2-6a3 3 0 11-6 0 3 3 0 016 0zm7 3a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
    />
  ),
};

const createLoadOptions =
  (
    action: (
      args: any,
    ) => Promise<{ success: boolean; body: any } | null | undefined>,
    options: { limit?: number; sortCityZones?: boolean } = {},
  ): LoadOptions =>
  async (inputValue?: string): Promise<SelectOption[]> => {
    const setParams: Record<string, unknown> = {
      limit: options.limit ?? 20,
      page: 1,
    };
    if (inputValue) setParams.name = inputValue;

    try {
      const response = await action({
        set: setParams,
        get: { _id: 1, name: 1 },
      });
      if (response && response.success) {
        const mapped = (response.body as { _id: string; name: string }[]).map(
          (item) => ({ value: item.name, label: item.name }),
        );
        return options.sortCityZones ? sortCityZoneOptions(mapped) : mapped;
      }
    } catch {
      return [];
    }
    return [];
  };

const NO_OPTIONS: LoadOptions = async () => [];

const SELECT_LOADERS: Record<string, LoadOptions> = {
  areaUsages: createLoadOptions(getAreaUsagesAction),
  airStatuses: createLoadOptions(getAirStatusesAction),
  roadDefects: createLoadOptions(getRoadDefectsAction),
  humanReasons: createLoadOptions(getHumanReasonsAction),
  vehicleReasons: createLoadOptions(getVehicleReasonsAction),
  equipmentDamages: createLoadOptions(getEquipmentDamagesAction),
  roadSurfaceConditions: createLoadOptions(getRoadSurfaceConditionsAction),
  vehicleMaxDamageSections: createLoadOptions(getMaxDamageSectionsAction),
  province: createLoadOptions(getProvincesAction),
  city: createLoadOptions(getCitiesAction),
  township: createLoadOptions(getTownshipsAction),
  road: createLoadOptions(getRoadsAction),
  trafficZone: createLoadOptions(getTrafficZonesAction),
  cityZone: createLoadOptions(getCityZonesAction, {
    limit: CITY_ZONE_OPTION_LIMIT,
    sortCityZones: true,
  }),
  position: createLoadOptions(getPositionsAction),
  rulingType: createLoadOptions(getRulingTypesAction),
  lightStatus: createLoadOptions(getLightStatusesAction),
  collisionType: createLoadOptions(getCollisionTypesAction),
  accidentType: createLoadOptions(getTypesAction),
  roadSituation: createLoadOptions(getRoadSituationsAction),
  roadRepairType: createLoadOptions(getRoadRepairTypesAction),
  shoulderStatus: createLoadOptions(getShoulderStatusesAction),
  vehicleColor: createLoadOptions(getColorsAction),
  vehicleSystem: createLoadOptions(getSystemsAction),
  vehiclePlaqueType: createLoadOptions(getPlaqueTypesAction),
  vehicleSystemType: createLoadOptions(getSystemTypesAction),
  vehicleFaultStatus: createLoadOptions(getFaultStatusesAction),
  vehicleInsuranceCo: createLoadOptions(getInsuranceCosAction),
  vehiclePlaqueUsage: createLoadOptions(getPlaqueUsagesAction),
  vehicleBodyInsuranceCo: createLoadOptions(getBodyInsuranceCosAction),
  vehicleMotionDirection: createLoadOptions(getMotionDirectionsAction),
  driverLicenceType: createLoadOptions(getLicenceTypesAction),
  passengerFaultStatus: createLoadOptions(getFaultStatusesAction),
  pedestrianFaultStatus: createLoadOptions(getFaultStatusesAction),
};

interface AccidentAdvancedSearchProps {
  pageAddress: string;
  onClose: () => void;
}

const AccidentAdvancedSearch: React.FC<AccidentAdvancedSearchProps> = ({
  pageAddress,
  onClose,
}) => {
  const router = useRouter();
  const currentSearchParams = useSearchParams();
  const [activeTab, setActiveTab] =
    useState<AccidentFilterTabId>("essentials");

  useScrollLock(true);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const initialFormValues: DeepPartial<AccidentSearchParams> = useMemo(() => {
    const params: DeepPartial<AccidentSearchParams> = {};

    for (const [key, value] of currentSearchParams.entries()) {
      if (ACCIDENT_FILTER_IGNORED_KEYS.has(key)) continue;
      if (!value) continue;

      if (ACCIDENT_ARRAY_FILTER_KEYS.has(key)) {
        params[key as keyof AccidentSearchParams] = value.split(
          ",",
        ) as never;
      } else if (ACCIDENT_NUMERIC_FILTER_KEYS.has(key)) {
        params[key as keyof AccidentSearchParams] = +value as never;
      } else {
        params[key as keyof AccidentSearchParams] = value as never;
      }
    }

    return params;
  }, [currentSearchParams]);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<AccidentSearchParams>({
    defaultValues: initialFormValues,
  });

  const [draftValues, setDraftValues] =
    useState<DeepPartial<AccidentSearchParams>>(initialFormValues);

  useEffect(() => {
    const subscription = watch((values) => {
      setDraftValues((previous) => ({
        ...previous,
        ...(values as DeepPartial<AccidentSearchParams>),
      }));
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const onSubmit: SubmitHandler<AccidentSearchParams> = () => {
    const criteria = { ...draftValues, ...getValues() };
    const params = new URLSearchParams();
    const limit = currentSearchParams.get("limit");
    if (limit) params.set("limit", limit);

    Object.entries(criteria).forEach(([key, value]) => {
      if (ACCIDENT_FILTER_IGNORED_KEYS.has(key)) return;

      if (Array.isArray(value)) {
        if (value.length > 0) params.set(key, value.join(","));
        return;
      }

      if (value !== undefined && value !== null && String(value).trim() !== "") {
        params.set(key, String(value));
      }
    });

    params.set("page", "1");
    router.push(`${pageAddress}?${params.toString()}`);
    onClose();
  };

  const clearAll = () => {
    const params = new URLSearchParams();
    const limit = currentSearchParams.get("limit");
    if (limit) params.set("limit", limit);
    const query = params.toString();
    router.push(query ? `${pageAddress}?${query}` : pageAddress);
    onClose();
  };

  const getSelectedValues = (name: FieldName): SelectOption[] => {
    const current = draftValues[name as keyof AccidentSearchParams];
    if (!Array.isArray(current)) return [];
    return current.map((value) => ({
      value: String(value),
      label: String(value),
    }));
  };

  const countTabValues = (fields: readonly string[]): number =>
    fields.reduce((total, field) => {
      const value = draftValues[field as FieldName];
      if (Array.isArray(value)) return total + value.length;
      if (value === undefined || value === null) return total;
      return String(value).trim() === "" ? total : total + 1;
    }, 0);

  const totalDraftFilters = ACCIDENT_FILTER_TABS.reduce(
    (total, tab) => total + countTabValues(tab.fields),
    0,
  );

  const renderField = (field: FieldConfig) => {
    if (field.kind === "input") {
      return (
        <MyInput
          key={field.name}
          name={field.name}
          label={field.label}
          placeholder={field.placeholder}
          register={register}
          errMsg={errors[field.name]?.message}
          type={field.type}
        />
      );
    }

    if (field.kind === "date") {
      return (
        <MyDateInput
          key={field.name}
          name={field.name}
          label={field.label}
          placeholder={field.placeholder}
          control={control}
          errMsg={errors[field.name]?.message}
        />
      );
    }

    if (field.kind === "select") {
      return (
        <MyAsyncMultiSelect
          key={field.name}
          name={field.name}
          label={field.label}
          placeholder={field.placeholder}
          setValue={setValue}
          value={getSelectedValues(field.name)}
          loadOptions={SELECT_LOADERS[field.name] ?? NO_OPTIONS}
          errMsg={errors[field.name]?.message}
          defaultOptions
          menuPortalTarget={typeof document !== "undefined" ? document.body : null}
        />
      );
    }

    return (
      <div key={field.name} className="flex flex-col gap-2">
        <label
          htmlFor={field.name}
          className="text-right text-sm font-medium text-fg-muted"
        >
          {field.label}
        </label>
        <select
          id={field.name}
          {...register(field.name)}
          className="w-full rounded-xl border border-line bg-surface-sunken px-3 py-2.5 text-sm text-fg outline-none transition-colors duration-200 hover:border-line-strong focus:border-line-focus"
        >
          <option value="">همه</option>
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const activeSections = TAB_CONTENT[activeTab];

  return createPortal(
    <div className="fixed inset-0 z-[100000]">
      <div
        className="absolute inset-0 animate-fade-in-fast bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="جستجوی پیشرفته تصادفات"
        className="absolute inset-y-0 right-0 flex w-full animate-drawer-in flex-col border-l border-line bg-surface shadow-2xl sm:max-w-[620px] lg:max-w-[680px]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line p-5">
          <div className="flex items-start gap-3">
            <div className="tint-red flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-tint-strong text-tint-fg">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M4 6h16M7 12h10M10 18h4"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-fg">جستجوی پیشرفته</h2>
              <p className="mt-1 text-xs text-fg-muted">
                فیلترها را در دسته‌های زیر تنظیم کنید؛ فقط بخش‌های مورد نیاز را پر کنید.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن جستجوی پیشرفته"
            className="rounded-lg p-2 text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </header>

        <nav
          aria-label="دسته‌های فیلتر"
          className="flex gap-1 overflow-x-auto border-b border-line bg-surface-sunken/60 px-3 py-2"
        >
          {ACCIDENT_FILTER_TABS.map((tab) => {
            const count = countTabValues(tab.fields);
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={isActive ? "true" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand text-on-brand shadow-sm"
                    : "text-fg-muted hover:bg-surface-hover hover:text-fg"
                }`}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {TAB_ICONS[tab.id]}
                </svg>
                <span>{tab.label}</span>
                {count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      isActive
                        ? "bg-white/20 text-on-brand"
                        : "tint-brand bg-tint-strong text-tint-fg"
                    }`}
                  >
                    {(count as number).toLocaleString("fa-IR")}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <form
          id="accident-advanced-search-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto p-5"
        >
          <div className="space-y-7">
            {activeSections.map((section, index) => (
              <section key={section.title ?? index} className="space-y-4">
                {section.title && (
                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-5 w-1 rounded-full bg-brand" />
                    <div>
                      <h3 className="text-sm font-bold text-fg">
                        {section.title}
                      </h3>
                      {section.description && (
                        <p className="mt-1 text-xs leading-6 text-fg-faint">
                          {section.description}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {section.fields.map(renderField)}
                </div>
              </section>
            ))}
          </div>
        </form>

        <footer className="flex items-center justify-between gap-3 border-t border-line bg-surface p-4">
          <button
            type="button"
            onClick={clearAll}
            className="rounded-xl border border-line-strong bg-surface px-4 py-2.5 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
          >
            پاک کردن فیلترها
          </button>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-fg-faint sm:inline">
              {totalDraftFilters > 0
                ? `${totalDraftFilters.toLocaleString("fa-IR")} فیلتر انتخاب شده`
                : "فیلتری انتخاب نشده"}
            </span>
            <button
              type="submit"
              form="accident-advanced-search-form"
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-on-brand shadow-md transition-all hover:bg-brand-hover hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-line-focus focus:ring-offset-2 focus:ring-offset-surface"
            >
              اعمال و جستجو
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
};

export default AccidentAdvancedSearch;
