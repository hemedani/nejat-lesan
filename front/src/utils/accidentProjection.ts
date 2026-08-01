export interface AccidentFieldOption {
  key: string;
  label: string;
  projection: Record<string, unknown>;
}

export const ACCIDENT_FIELD_OPTIONS: AccidentFieldOption[] = [
  { key: "_id", label: "شناسه", projection: { _id: 1 } },
  { key: "seri", label: "سری", projection: { seri: 1 } },
  { key: "serial", label: "شماره", projection: { serial: 1 } },
  { key: "location", label: "موقعیت جغرافیایی", projection: { location: 1 } },
  { key: "date_of_accident", label: "تاریخ تصادف", projection: { date_of_accident: 1 } },
  { key: "dead_count", label: "تعداد متوفیان", projection: { dead_count: 1 } },
  { key: "has_witness", label: "دارای شاهد", projection: { has_witness: 1 } },
  { key: "news_number", label: "شماره خبر", projection: { news_number: 1 } },
  { key: "officer", label: "مامور", projection: { officer: 1 } },
  { key: "injured_count", label: "تعداد مجروحان", projection: { injured_count: 1 } },
  { key: "completion_date", label: "تاریخ تکمیل", projection: { completion_date: 1 } },
  { key: "createdAt", label: "زمان ثبت", projection: { createdAt: 1 } },
  { key: "updatedAt", label: "زمان بروزرسانی", projection: { updatedAt: 1 } },
  { key: "province", label: "استان", projection: { province: { name: 1 } } },
  { key: "city", label: "شهر", projection: { city: { name: 1 } } },
  { key: "township", label: "شهرستان", projection: { township: { name: 1 } } },
  { key: "road", label: "راه", projection: { road: { name: 1 } } },
  { key: "traffic_zone", label: "منطقه ترافیکی", projection: { traffic_zone: { name: 1 } } },
  { key: "city_zone", label: "منطقه شهری", projection: { city_zone: { name: 1 } } },
  { key: "type", label: "نوع تصادف", projection: { type: { name: 1 } } },
  { key: "area_usages", label: "کاربری اراضی", projection: { area_usages: { name: 1 } } },
  { key: "position", label: "موقعیت", projection: { position: { name: 1 } } },
  { key: "ruling_type", label: "نوع رای", projection: { ruling_type: { name: 1 } } },
  { key: "air_statuses", label: "وضعیت آب و هوا", projection: { air_statuses: { name: 1 } } },
  { key: "light_status", label: "وضعیت روشنایی", projection: { light_status: { name: 1 } } },
  { key: "road_defects", label: "نقایص راه", projection: { road_defects: { name: 1 } } },
  { key: "human_reasons", label: "عوامل انسانی", projection: { human_reasons: { name: 1 } } },
  { key: "collision_type", label: "نوع برخورد", projection: { collision_type: { name: 1 } } },
  { key: "road_situation", label: "وضعیت راه", projection: { road_situation: { name: 1 } } },
  { key: "road_repair_type", label: "نوع تعمیرات راه", projection: { road_repair_type: { name: 1 } } },
  { key: "shoulder_status", label: "وضعیت شانه", projection: { shoulder_status: { name: 1 } } },
  { key: "vehicle_reasons", label: "عوامل وسیله نقلیه", projection: { vehicle_reasons: { name: 1 } } },
  { key: "equipment_damages", label: "خسارات تجهیزات", projection: { equipment_damages: { name: 1 } } },
  { key: "road_surface_conditions", label: "وضعیت سطح راه", projection: { road_surface_conditions: { name: 1 } } },
  { key: "attachments", label: "پیوست‌ها", projection: { attachments: 1 } },
  { key: "vehicle_dtos", label: "وسایل نقلیه", projection: { vehicle_dtos: 1 } },
  { key: "pedestrian_dtos", label: "عابران پیاده", projection: { pedestrian_dtos: 1 } },
];

// Minimal projection for the map overlay markers/popups (keeps the payload light)
export const MAP_PROJECTION: Record<string, unknown> = {
  _id: 1,
  location: 1,
  type: { name: 1 },
  date_of_accident: 1,
  dead_count: 1,
  injured_count: 1,
  collision_type: { name: 1 },
  light_status: { name: 1 },
  province: { name: 1 },
  city: { name: 1 },
  road: { name: 1 },
};

export const buildAccidentProjection = (
  keys: Iterable<string>,
): Record<string, unknown> => {
  const selected = new Set(keys);
  const projection: Record<string, unknown> = {};
  for (const option of ACCIDENT_FIELD_OPTIONS) {
    if (selected.has(option.key)) {
      Object.assign(projection, option.projection);
    }
  }
  return projection;
};

export const DEFAULT_FIELD_KEYS: string[] = [
  "_id",
  "location",
  "date_of_accident",
  "dead_count",
  "injured_count",
  "type",
  "collision_type",
  "light_status",
  "position",
  "road_defects",
  "human_reasons",
  "vehicle_dtos",
  "pedestrian_dtos",
];

export const DEFAULT_PROJECTION: Record<string, unknown> =
  buildAccidentProjection(DEFAULT_FIELD_KEYS);
