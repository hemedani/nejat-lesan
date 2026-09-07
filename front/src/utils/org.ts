import type { UnitType } from "@/services/org-projections";
import type { ModuleKey } from "@/types/auth";

export const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  Patrol: "گشت",
  Station: "پاسگاه",
  Ops: "عملیات",
  Maintenance: "نگهداری راه",
  Logistics: "پشتیبانی و لجستیک",
  Administration: "اداری",
  Warehouse: "انبار",
  General: "عمومی",
};

export const UNIT_TYPE_TONES: Record<UnitType, string> = {
  Patrol: "bg-cyan-500/15 text-cyan-200 border-cyan-400/25",
  Station: "bg-blue-500/15 text-blue-200 border-blue-400/25",
  Ops: "bg-violet-500/15 text-violet-200 border-violet-400/25",
  Maintenance: "bg-emerald-500/15 text-emerald-200 border-emerald-400/25",
  Logistics: "bg-amber-500/15 text-amber-200 border-amber-400/25",
  Administration: "bg-rose-500/15 text-rose-200 border-rose-400/25",
  Warehouse: "bg-teal-500/15 text-teal-200 border-teal-400/25",
  General: "bg-slate-500/15 text-slate-200 border-slate-400/25",
};

export const INCIDENT_TYPE_LABELS: Record<string, string> = {
  accident: "تصادف",
  road_breakdown: "خرابی راه",
  road_obstacle: "مانع جاده",
  other: "سایر رخدادها",
};

export const INCIDENT_TYPE_ORDER: Array<"accident" | "road_breakdown" | "road_obstacle" | "other"> = [
  "accident",
  "road_breakdown",
  "road_obstacle",
  "other",
];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  charts: "تحلیل و نمودار تصادفات",
  incident_patrol: "ثبت رخداد موبایل و داشبورد گشت",
  warehouse: "مدیریت انبار",
};
