import toast from "react-hot-toast";

const translateArticleType = (articleType: string): string => {
  switch (articleType) {
    case "journalArticle":
      return "مقاله ژورنالی";
    case "book":
      return "کتاب";
    default:
      return "نامشخص";
  }
};

const translateGender = (gender: string): string => {
  switch (gender) {
    case "Male":
      return "مرد";
    case "Female":
      return "زن";
    default:
      return "نامشخص";
  }
};

const translateLevel = (level: string): string => {
  switch (level) {
    case "Ghost":
      return "ادمین";
    case "Manager":
      return "مدیر";
    case "Editor":
      return "ویرایشگر";
    case "Normal":
      return "عادی";
    default:
      return "نامشخص";
  }
};

const converDate = (formatDate: string) => {
  return new Date(formatDate).toLocaleDateString("fa-IR");
};

const CalculateDivision = (countPage: number, limit: number = 21): string => {
  const countPageData = countPage / limit;
  return countPageData.toFixed(0);
};

const ToastNotify = (type: "success" | "error", message: string) => {
  if (type === "success") {
    toast.success(message);
  } else {
    toast.error(`خطا - ${message}`);
  }
};

const ArrayToSelectOptions = <T>(
  data: T[],
  valueKey: keyof T,
  labelKey: keyof T,
  secondaryLabelKey?: keyof T
) => {
  return data.map((item) => ({
    value: String(item[valueKey]),
    label: `${item[labelKey]} ${secondaryLabelKey ? item[secondaryLabelKey] : ""
      }`,
  }));
};

export type ModelName =
  | "user"
  | "city"
  | "province"
  | "road"
  | "traffic_zone"
  | "city_zone"
  | "accident"
  | "air_status"
  | "area_usage"
  | "body_insurance_co"
  | "collision_type"
  | "color"
  | "equipment_damage"
  | "fault_status"
  | "human_reason"
  | "insurance_co"
  | "licence_type"
  | "light_status"
  | "max_damage_section"
  | "motion_direction"
  | "plaque_type"
  | "plaque_usage"
  | "position"
  | "road_defect"
  | "road_repair_type"
  | "road_situation"
  | "road_surface_condition"
  | "ruling_type"
  | "shoulder_status"
  | "system"
  | "system_type"
  | "type"
  | "vehicle_reason";

function translateModelNameToPersian(modelName: ModelName): string {
  switch (modelName) {
    case "user":
      return "کاربر";
    case "city":
      return "شهر";
    case "province":
      return "استان";
    case "road":
      return "جاده";
    case "traffic_zone":
      return "منطقه ترافیکی";
    case "city_zone":
      return "منطقه شهری";
    case "accident":
      return "تصادف";
    case "air_status":
      return "وضعیت هوا";
    case "area_usage":
      return "نوع کاربری منطقه";
    case "body_insurance_co":
      return "شرکت بیمه بدنه";
    case "collision_type":
      return "نوع برخورد";
    case "color":
      return "رنگ";
    case "equipment_damage":
      return "خسارت تجهیزات";
    case "fault_status":
      return "وضعیت مقصر";
    case "human_reason":
      return "علت انسانی";
    case "insurance_co":
      return "شرکت بیمه";
    case "licence_type":
      return "نوع گواهینامه";
    case "light_status":
      return "وضعیت نور";
    case "max_damage_section":
      return "بیشترین خسارت در بخش";
    case "motion_direction":
      return "جهت حرکت";
    case "plaque_type":
      return "نوع پلاک";
    case "plaque_usage":
      return "نوع کاربری پلاک";
    case "position":
      return "موقعیت";
    case "road_defect":
      return "عیب جاده";
    case "road_repair_type":
      return "نوع تعمیر جاده";
    case "road_situation":
      return "وضعیت جاده";
    case "road_surface_condition":
      return "شرایط سطح جاده";
    case "ruling_type":
      return "نوع حکم";
    case "shoulder_status":
      return "وضعیت شانه جاده";
    case "system":
      return "سیستم";
    case "system_type":
      return "نوع سیستم";
    case "type":
      return "نوع";
    case "vehicle_reason":
      return "علت مربوط به خودرو";
    default:
      return "نامشخص";
  }
}


function snakeToKebabCase(input: string): string {
  return input.replace(/_/g, "-");
}

export {
  translateArticleType,
  CalculateDivision,
  ToastNotify,
  ArrayToSelectOptions,
  converDate,
  translateGender,
  translateLevel,
  translateModelNameToPersian,
  snakeToKebabCase
};
