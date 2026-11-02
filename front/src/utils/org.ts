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

/**
 * Per-unit-type chip colours.
 *
 * These were `tint-cyan bg-tint-soft text-tint-fg border-tint-border` — a translucent
 * mid-hue wash plus a *pale* label. On the dark shell that reads as a soft tint;
 * on a white card the wash is invisible and a `-200` label is white-on-white,
 * which is what made the `/orghead` summary row unreadable in light mode.
 *
 * `tint-*` resolves all four roles from one hue and re-derives them per theme
 * (`--tint-soft-strength` etc. differ between `:root` and `[data-theme=light]`),
 * so there is exactly one place to tune. Keep the hue, drop the palette ramp.
 */
export const UNIT_TYPE_TONES: Record<UnitType, string> = {
  Patrol: "tint-cyan bg-tint-soft text-tint-fg border-tint-border",
  Station: "tint-brand bg-tint-soft text-tint-fg border-tint-border",
  Ops: "tint-violet bg-tint-soft text-tint-fg border-tint-border",
  Maintenance: "tint-emerald bg-tint-soft text-tint-fg border-tint-border",
  Logistics: "tint-amber bg-tint-soft text-tint-fg border-tint-border",
  Administration: "tint-rose bg-tint-soft text-tint-fg border-tint-border",
  Warehouse: "tint-teal bg-tint-soft text-tint-fg border-tint-border",
  General: "tint-slate bg-tint-soft text-tint-fg border-tint-border",
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

/**
 * The four licensable modules, in the order the backend expects.
 *
 * **`forms` is last on purpose.** `moduleKeyFor` in
 * `back/src/app_modules/moduleConfig.ts` iterates this list and returns on the
 * first match. `incident_patrol` registers whole-schema wildcards including
 * `incident_report.*`, so a `forms` key registered earlier would be shadowed and
 * the `form_definition` gate would never run — authoring would stay reachable
 * with the module switched off.
 *
 * This list has no resolver of its own; it mirrors the backend's order so the two
 * licensing screens cannot disagree about what is licensed. Asserted by R4-class
 * checks in `.workbuddy-ai/tools/panel-routing.test.mjs`.
 */
export const MODULE_KEYS: ModuleKey[] = ["charts", "incident_patrol", "warehouse", "forms"];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  charts: "تحلیل و نمودار تصادفات",
  incident_patrol: "ثبت رخداد موبایل و داشبورد گشت",
  warehouse: "مدیریت انبار",
  forms: "فرم‌ساز پویا",
};
