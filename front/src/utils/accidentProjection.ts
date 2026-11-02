/**
 * One selectable column: the key it reads, and the projection fragment that
 * fetches it.
 *
 * **A Lesan relation's fragment must be an object; only a scalar or an embedded
 * struct takes `1`.** The two exceptions this file used to make — `officer` and
 * `attachments`, both sent as `1` — are rejected at runtime by the act's validator
 * with `Expected an object, but received: 1`, so ticking either column in the
 * console's column picker 500'd the request. Neither is in
 * `DEFAULT_FIELD_KEYS`, which is why the default view never hit it.
 *
 * `audit-projection-shapes.py` now enforces this for every fragment here and in
 * `services/patrol-projections.ts`.
 */
export interface AccidentFieldOption {
  key: string;
  label: string;
  projection: Record<string, unknown>;
  /** Position in the column picker and the table header. */
  order: number;
  /** Selected on first load and restored by «بازنشانی به پیش‌فرض». */
  defaultVisible: boolean;
  /** Whether the user may choose this column. Hidden/system fields are omitted. */
  selectable: boolean;
}

/**
 * Single source of truth for the accident table's columns.
 *
 * The order here is the order in both the checkboxes and the table header.
 * The first 15 are `defaultVisible`, matching the QA report; the remaining 15
 * are opt-in. System fields removed from the old picker are deliberately
 * absent so neither the list nor «select all» can bring them back.
 */
export const ACCIDENT_FIELD_OPTIONS: AccidentFieldOption[] = [
  { key: "seri", label: "سری", order: 1, defaultVisible: true, selectable: true, projection: { seri: 1 } },
  { key: "serial", label: "سریال", order: 2, defaultVisible: true, selectable: true, projection: { serial: 1 } },
  { key: "date_of_accident", label: "تاریخ و ساعت تصادف", order: 3, defaultVisible: true, selectable: true, projection: { date_of_accident: 1 } },
  { key: "type", label: "نوع تصادف", order: 4, defaultVisible: true, selectable: true, projection: { type: { name: 1 } } },
  { key: "province", label: "استان", order: 5, defaultVisible: true, selectable: true, projection: { province: { name: 1 } } },
  { key: "city", label: "شهر", order: 6, defaultVisible: true, selectable: true, projection: { city: { name: 1 } } },
  { key: "road", label: "راه", order: 7, defaultVisible: true, selectable: true, projection: { road: { name: 1 } } },
  { key: "location", label: "موقعیت جغرافیایی", order: 8, defaultVisible: true, selectable: true, projection: { location: 1 } },
  { key: "collision_type", label: "نوع برخورد", order: 9, defaultVisible: true, selectable: true, projection: { collision_type: { name: 1 } } },
  { key: "light_status", label: "وضعیت روشنایی", order: 10, defaultVisible: true, selectable: true, projection: { light_status: { name: 1 } } },
  { key: "air_statuses", label: "وضعیت آب و هوا", order: 11, defaultVisible: true, selectable: true, projection: { air_statuses: { name: 1 } } },
  { key: "road_defects", label: "نقایص راه", order: 12, defaultVisible: true, selectable: true, projection: { road_defects: { name: 1 } } },
  { key: "road_surface_conditions", label: "وضعیت سطح راه", order: 13, defaultVisible: true, selectable: true, projection: { road_surface_conditions: { name: 1 } } },
  { key: "road_situation", label: "نوع راه", order: 14, defaultVisible: true, selectable: true, projection: { road_situation: { name: 1 } } },
  { key: "area_usages", label: "کاربری اراضی", order: 15, defaultVisible: true, selectable: true, projection: { area_usages: { name: 1 } } },
  { key: "dead_count", label: "تعداد متوفیان", order: 16, defaultVisible: false, selectable: true, projection: { dead_count: 1 } },
  { key: "injured_count", label: "تعداد مجروحان", order: 17, defaultVisible: false, selectable: true, projection: { injured_count: 1 } },
  { key: "traffic_zone", label: "منطقه ترافیکی", order: 18, defaultVisible: false, selectable: true, projection: { traffic_zone: { name: 1 } } },
  { key: "city_zone", label: "منطقه شهری", order: 19, defaultVisible: false, selectable: true, projection: { city_zone: { name: 1 } } },
  { key: "human_reasons", label: "عوامل انسانی", order: 20, defaultVisible: false, selectable: true, projection: { human_reasons: { name: 1 } } },
  { key: "vehicle_reasons", label: "عوامل وسیله نقلیه", order: 21, defaultVisible: false, selectable: true, projection: { vehicle_reasons: { name: 1 } } },
  { key: "road_repair_type", label: "نوع تعمیرات راه", order: 22, defaultVisible: false, selectable: true, projection: { road_repair_type: { name: 1 } } },
  { key: "equipment_damages", label: "خسارت تجهیزات", order: 23, defaultVisible: false, selectable: true, projection: { equipment_damages: { name: 1 } } },
  { key: "shoulder_status", label: "وضعیت شانه", order: 24, defaultVisible: false, selectable: true, projection: { shoulder_status: { name: 1 } } },
  { key: "vehicle_dtos", label: "وسیله نقلیه", order: 25, defaultVisible: false, selectable: true, projection: { vehicle_dtos: 1 } },
  { key: "pedestrian_dtos", label: "عابر پیاده", order: 26, defaultVisible: false, selectable: true, projection: { pedestrian_dtos: 1 } },
  { key: "ruling_type", label: "وضعیت خط‌کشی", order: 27, defaultVisible: false, selectable: true, projection: { ruling_type: { name: 1 } } },
  { key: "position", label: "موقعیت", order: 28, defaultVisible: false, selectable: true, projection: { position: { name: 1 } } },
  {
    key: "officer",
    label: "مأمور",
    order: 29,
    defaultVisible: false,
    selectable: true,
    projection: { officer: { first_name: 1, last_name: 1, personnel_code: 1 } },
  },
  {
    key: "attachments",
    label: "پیوست‌ها",
    order: 30,
    defaultVisible: false,
    selectable: true,
    projection: { attachments: { name: 1, type: 1, size: 1 } },
  },
].sort((a, b) => a.order - b.order);

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

export const DEFAULT_FIELD_KEYS: string[] = ACCIDENT_FIELD_OPTIONS
  .filter((option) => option.defaultVisible)
  .map((option) => option.key);

export const DEFAULT_PROJECTION: Record<string, unknown> =
  buildAccidentProjection(DEFAULT_FIELD_KEYS);
