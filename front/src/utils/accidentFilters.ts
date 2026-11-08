import type { ReqType } from "@/types/declarations/selectInp";

export type AccidentSearchParams =
  ReqType["main"]["accident"]["gets"]["set"];

export const ACCIDENT_ARRAY_FILTER_KEYS = new Set<string>([
  "areaUsages",
  "airStatuses",
  "roadDefects",
  "humanReasons",
  "vehicleReasons",
  "equipmentDamages",
  "roadSurfaceConditions",
  "vehicleMaxDamageSections",
  "province",
  "city",
  "township",
  "road",
  "trafficZone",
  "cityZone",
  "accidentType",
  "position",
  "rulingType",
  "lightStatus",
  "collisionType",
  "roadSituation",
  "roadRepairType",
  "shoulderStatus",
  "vehicleColor",
  "vehicleSystem",
  "vehiclePlaqueType",
  "vehicleSystemType",
  "vehicleFaultStatus",
  "vehicleInsuranceCo",
  "vehiclePlaqueUsage",
  "vehicleBodyInsuranceCo",
  "vehicleMotionDirection",
  "driverLicenceType",
  "passengerFaultStatus",
  "pedestrianFaultStatus",
]);

export const ACCIDENT_NUMERIC_FILTER_KEYS = new Set<string>([
  "page",
  "limit",
  "seri",
  "serial",
  "deadCount",
  "deadCountMin",
  "deadCountMax",
  "injuredCount",
  "injuredCountMin",
  "injuredCountMax",
  "newsNumber",
  "vehicleInsuranceWarrantyLimit",
  "vehicleInsuranceWarrantyLimitMin",
  "vehicleInsuranceWarrantyLimitMax",
]);

export const ACCIDENT_FILTER_LABELS: Record<string, string> = {
  seri: "سری تصادف",
  serial: "سریال داخلی",
  incidentType: "نوع حادثه",
  dateOfAccidentFrom: "تاریخ تصادف از",
  dateOfAccidentTo: "تاریخ تصادف تا",
  deadCount: "تعداد فوتی",
  deadCountMin: "حداقل فوتی",
  deadCountMax: "حداکثر فوتی",
  injuredCount: "تعداد مجروح",
  injuredCountMin: "حداقل مجروح",
  injuredCountMax: "حداکثر مجروح",
  hasWitness: "دارای شاهد",
  newsNumber: "شماره خبر",
  officer: "افسر رسیدگی‌کننده",
  completionDateFrom: "تاریخ تکمیل از",
  completionDateTo: "تاریخ تکمیل تا",
  province: "استان",
  city: "شهر",
  township: "شهرستان",
  road: "جاده / خیابان",
  trafficZone: "محدوده ترافیکی",
  cityZone: "منطقه شهری",
  accidentType: "نوع حادثه",
  position: "موقعیت ثبت‌کننده",
  rulingType: "وضعیت خط‌کشی",
  lightStatus: "وضعیت روشنایی",
  collisionType: "نوع برخورد",
  roadSituation: "نوع راه",
  roadRepairType: "نوع تعمیرات راه",
  shoulderStatus: "وضعیت شانه راه",
  areaUsages: "کاربری منطقه",
  airStatuses: "وضعیت جوی",
  roadDefects: "نقایص راه",
  humanReasons: "علل انسانی",
  vehicleReasons: "علل وسیله نقلیه",
  equipmentDamages: "خسارت تجهیزات",
  roadSurfaceConditions: "وضعیت سطح راه",
  vehicleMaxDamageSections: "محل اصلی خسارت",
  attachmentName: "نام فایل ضمیمه",
  attachmentType: "نوع فایل ضمیمه",
  vehicleColor: "رنگ خودرو",
  vehicleSystem: "سیستم خودرو",
  vehiclePlaqueType: "نوع پلاک",
  vehicleSystemType: "تیپ خودرو",
  vehicleFaultStatus: "وضعیت تقصیر خودرو",
  vehicleInsuranceCo: "شرکت بیمه خودرو",
  vehicleInsuranceNo: "شماره بیمه‌نامه",
  vehiclePlaqueUsage: "کاربری پلاک",
  vehiclePrintNumber: "شماره چاپ پلاک",
  vehiclePlaqueSerialElement: "سریال پلاک",
  vehicleInsuranceDateFrom: "تاریخ بیمه از",
  vehicleInsuranceDateTo: "تاریخ بیمه تا",
  vehicleBodyInsuranceCo: "شرکت بیمه بدنه",
  vehicleBodyInsuranceNo: "شماره بیمه بدنه",
  vehicleMotionDirection: "جهت حرکت",
  vehicleBodyInsuranceDateFrom: "تاریخ بیمه بدنه از",
  vehicleBodyInsuranceDateTo: "تاریخ بیمه بدنه تا",
  vehicleDamageSectionOther: "سایر خسارات",
  vehicleInsuranceWarrantyLimit: "سقف تعهد بیمه",
  vehicleInsuranceWarrantyLimitMin: "حداقل سقف تعهد",
  vehicleInsuranceWarrantyLimitMax: "حداکثر سقف تعهد",
  driverSex: "جنسیت راننده",
  driverFirstName: "نام راننده",
  driverLastName: "نام خانوادگی راننده",
  driverNationalCode: "کد ملی راننده",
  driverLicenceNumber: "شماره گواهینامه",
  driverLicenceType: "نوع گواهینامه",
  driverInjuryType: "نوع مصدومیت راننده",
  driverTotalReason: "علت تخلف راننده",
  passengerSex: "جنسیت سرنشین",
  passengerFirstName: "نام سرنشین",
  passengerLastName: "نام خانوادگی سرنشین",
  passengerNationalCode: "کد ملی سرنشین",
  passengerInjuryType: "نوع مصدومیت سرنشین",
  passengerFaultStatus: "وضعیت تقصیر سرنشین",
  passengerTotalReason: "علت تخلف سرنشین",
  pedestrianSex: "جنسیت عابر",
  pedestrianFirstName: "نام عابر",
  pedestrianLastName: "نام خانوادگی عابر",
  pedestrianNationalCode: "کد ملی عابر",
  pedestrianInjuryType: "نوع مصدومیت عابر",
  pedestrianFaultStatus: "وضعیت تقصیر عابر",
  pedestrianTotalReason: "علت تخلف عابر",
};

export const ACCIDENT_FILTER_IGNORED_KEYS = new Set(["page", "limit"]);

export const ACCIDENT_FILTER_TABS = [
  {
    id: "essentials",
    label: "جزئیات تصادف",
    fields: [
      "seri",
      "serial",
      "dateOfAccidentFrom",
      "dateOfAccidentTo",
      "completionDateFrom",
      "completionDateTo",
      "deadCount",
      "deadCountMin",
      "deadCountMax",
      "injuredCount",
      "injuredCountMin",
      "injuredCountMax",
      "hasWitness",
      "newsNumber",
      "officer",
      "attachmentName",
      "attachmentType",
    ],
  },
  {
    id: "location",
    label: "موقعیت",
    fields: [
      "province",
      "city",
      "township",
      "road",
      "trafficZone",
      "cityZone",
      "position",
    ],
  },
  {
    id: "conditions",
    label: "شرایط و عوامل",
    fields: [
      "areaUsages",
      "airStatuses",
      "roadDefects",
      "humanReasons",
      "vehicleReasons",
      "equipmentDamages",
      "roadSurfaceConditions",
      "accidentType",
      "rulingType",
      "lightStatus",
      "collisionType",
      "roadSituation",
      "roadRepairType",
      "shoulderStatus",
      "vehicleMaxDamageSections",
    ],
  },
  {
    id: "vehicle",
    label: "خودرو و بیمه",
    fields: [
      "vehicleColor",
      "vehicleSystem",
      "vehiclePlaqueType",
      "vehicleSystemType",
      "vehicleFaultStatus",
      "vehicleInsuranceCo",
      "vehicleInsuranceNo",
      "vehiclePlaqueUsage",
      "vehiclePrintNumber",
      "vehiclePlaqueSerialElement",
      "vehicleInsuranceDateFrom",
      "vehicleInsuranceDateTo",
      "vehicleBodyInsuranceCo",
      "vehicleBodyInsuranceNo",
      "vehicleMotionDirection",
      "vehicleBodyInsuranceDateFrom",
      "vehicleBodyInsuranceDateTo",
      "vehicleDamageSectionOther",
      "vehicleInsuranceWarrantyLimit",
      "vehicleInsuranceWarrantyLimitMin",
      "vehicleInsuranceWarrantyLimitMax",
    ],
  },
  {
    id: "people",
    label: "افراد",
    fields: [
      "driverSex",
      "driverFirstName",
      "driverLastName",
      "driverNationalCode",
      "driverLicenceNumber",
      "driverLicenceType",
      "driverInjuryType",
      "driverTotalReason",
      "passengerSex",
      "passengerFirstName",
      "passengerLastName",
      "passengerNationalCode",
      "passengerInjuryType",
      "passengerFaultStatus",
      "passengerTotalReason",
      "pedestrianSex",
      "pedestrianFirstName",
      "pedestrianLastName",
      "pedestrianNationalCode",
      "pedestrianInjuryType",
      "pedestrianFaultStatus",
      "pedestrianTotalReason",
    ],
  },
] as const;

export type AccidentFilterTabId = (typeof ACCIDENT_FILTER_TABS)[number]["id"];

export interface ActiveFilterChip {
  key: string;
  label: string;
  value: string;
  displayValue: string;
}

const SEX_LABELS: Record<string, string> = {
  Male: "مرد",
  Female: "زن",
  Other: "سایر",
};

const formatValue = (key: string, value: string): string => {
  if (key === "hasWitness") {
    if (value === "true") return "دارد";
    if (value === "false") return "ندارد";
  }
  return SEX_LABELS[value] ?? value;
};

export const getAccidentFilterLabel = (key: string): string =>
  ACCIDENT_FILTER_LABELS[key] ?? key;

export const readActiveFilterChips = (
  params: URLSearchParams,
): ActiveFilterChip[] => {
  const chips: ActiveFilterChip[] = [];

  params.forEach((rawValue, key) => {
    if (ACCIDENT_FILTER_IGNORED_KEYS.has(key) || !rawValue) return;

    const values = ACCIDENT_ARRAY_FILTER_KEYS.has(key)
      ? rawValue.split(",").filter(Boolean)
      : [rawValue];

    for (const value of values) {
      chips.push({
        key,
        label: getAccidentFilterLabel(key),
        value,
        displayValue: formatValue(key, value),
      });
    }
  });

  return chips;
};

export const countActiveFilterValues = (
  params: URLSearchParams,
  fields: readonly string[],
): number => {
  const allowed = new Set(fields);
  let count = 0;

  params.forEach((rawValue, key) => {
    if (!allowed.has(key) || !rawValue) return;
    count += ACCIDENT_ARRAY_FILTER_KEYS.has(key)
      ? rawValue.split(",").filter(Boolean).length
      : 1;
  });

  return count;
};

export const countActiveFilters = (params: URLSearchParams): number =>
  readActiveFilterChips(params).length;

export const removeFilterChip = (params: URLSearchParams, chip: ActiveFilterChip) => {
  if (!ACCIDENT_ARRAY_FILTER_KEYS.has(chip.key)) {
    params.delete(chip.key);
    return;
  }

  const remaining = (params.get(chip.key) ?? "")
    .split(",")
    .filter((value) => value && value !== chip.value);

  if (remaining.length > 0) {
    params.set(chip.key, remaining.join(","));
  } else {
    params.delete(chip.key);
  }
};
