"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";
import type { ReportDetailDoc, ReportSource } from "@/types/report-detail";

/**
 * The two projection types, named once.
 *
 * These exist so the projections below are **checked**. An earlier version cast
 * each one `as never`, which silenced every field check — and so `attachments: 1`
 * shipped, which the backend rejected at runtime with
 * `get.attachments -- Expected an object, but received: 1`. TypeScript already had
 * the information needed to catch that; the cast threw it away.
 */
type AccidentGet = ReqType["main"]["accident"]["get"]["get"];
type IncidentReportGet = ReqType["main"]["incident_report"]["get"]["get"];

/**
 * One report, from whichever collection it came from.
 *
 * The oversight console merges `accident` and `incident_report` into one table and
 * links both kinds into the same `[reportId]` route, carrying the kind in
 * `?source=`. This is the one place that branching happens, so no component has to
 * know that a non-accident id is not in `accident`.
 *
 * ## Why there is no second request for the review trail
 *
 * `review_history` is an **embedded array** on both models (`accident.ts:254`,
 * `incident_report.ts:174`) whose `reviewer` is a snapshot, not a relation — so
 * `review_history: 1` returns the whole trail inside this response. The separate
 * `accident.getReportReviewHistory` call existed only because `accident.get` used
 * to carry no `grantAccess` and no scope: it always succeeded, so the history was
 * the single thing that could be refused. `accident.get` now resolves its scope
 * through `getOrgReportBase`, which means a report the caller may not see fails
 * *here* — the correct answer. There is no longer a "visible report, refused
 * trail" case to degrade from, so the second fetch is deleted rather than kept as
 * a fallback.
 *
 * ## Two response shapes, and this is the trap
 *
 * `accident.get`'s fn is `accident.aggregation(...).toArray()`, so `body` is a
 * **one-element array**. `incident_report.get`'s fn is `findOne`, so `body` is
 * the **object**. `accident/get.ts` does not call `asSingleItemResponse`, which is
 * why every detail view that did `unwrapApiResponse<PatrolReport>` on the raw
 * response was really reading an array and rendering an empty shell. Normalised
 * here once.
 */

/**
 * The accident projection.
 *
 * Every `vehicle_dtos` / `people_dtos` / `facility_damage_dtos` / `attachments`
 * entry is an **embedded struct**, not a relation, so `1` returns the whole
 * sub-document — driver, insurance, passengers and all. Only genuine relations
 * need spelling out their fields, and the validator is `selectStruct("accident", 2)`
 * so one level of nesting is permitted.
 *
 * Named rather than inlined at the call site, and always merged over the caller's
 * own `get`, per the "never send an empty `get`" rule in `front/AGENTS.md`.
 */
const ACCIDENT_PROJECTION = {
  // lifecycle
  report_id: 1,
  serial: 1,
  seri: 1,
  sync_status: 1,
  rejection_reason: 1,
  synced_at: 1,
  review_status: 1,
  review_reason: 1,
  reviewed_at: 1,
  completed_at: 1,
  reported_at: 1,

  // the accident itself
  date_of_accident: 1,
  dead_count: 1,
  injured_count: 1,
  has_witness: 1,
  news_number: 1,
  completion_date: 1,
  incident_type: 1,
  incident_payload: 1,
  type: { _id: 1, name: 1 },
  collision_type: { _id: 1, name: 1 },
  croquis_type: { _id: 1, name: 1 },

  // police block
  police_present: 1,
  police_expert_name: 1,
  police_arrival_time: 1,
  officer_cause_description: 1,

  // where
  location: 1,
  gps_coords: 1,
  gps_accuracy: 1,
  travel_direction: 1,
  kilometer: 1,
  meter: 1,
  lane: { _id: 1, name: 1 },
  area_usages: { _id: 1, name: 1 },
  light_status: { _id: 1, name: 1 },
  air_statuses: { _id: 1, name: 1 },
  road_surface_conditions: { _id: 1, name: 1 },
  road_situation: { _id: 1, name: 1 },
  shoulder_status: { _id: 1, name: 1 },

  // who
  officer: { _id: 1, first_name: 1, last_name: 1, personnel_code: 1 },
  reviewer: { _id: 1, first_name: 1, last_name: 1 },
  patrol_unit: { _id: 1, code: 1, name: 1 },
  vehicle: { _id: 1, plaque_no: 1, title: 1 },
  police_station: { _id: 1, name: 1, code: 1 },
  organization: { _id: 1, name: 1, code: 1 },
  province: { _id: 1, name: 1 },
  city: { _id: 1, name: 1 },
  township: { _id: 1, name: 1 },
  road: { _id: 1, name: 1, origin: 1, destination: 1 },
  traffic_zone: { _id: 1, name: 1 },
  city_zone: { _id: 1, name: 1 },
  position: { _id: 1, name: 1 },
  incident_severity: { _id: 1, name: 1 },
  road_defects: { _id: 1, name: 1 },
  equipment_damages: { _id: 1, name: 1 },

  // the body of the report
  vehicle_dtos: 1,
  pedestrian_dtos: 1,
  people_dtos: 1,
  facility_damage_dtos: 1,
  attachments: { _id: 1, name: 1, type: 1, size: 1, category: 1, sequence: 1 },
  dynamic_answers: 1,
  review_history: 1,
  submitted_from: 1,
} as const satisfies AccidentGet;

/**
 * The `incident_report` projection.
 *
 * Cannot be the accident one: `incident_report.get`'s validator is
 * `selectStruct("incident_report", 1)` and **rejects** `serial` and `collision_type`
 * as unknown keys — Superstruct validates `get` strictly, so an over-wide
 * projection is a validation error rather than an ignored field. Hence two named
 * projections rather than one shared superset.
 */
const INCIDENT_REPORT_PROJECTION = {
  report_id: 1,
  serial: 1,
  form_definition_id: 1,
  form_title: 1,
  form_icon: 1,
  form_version: 1,
  sync_status: 1,
  rejection_reason: 1,
  synced_at: 1,
  review_status: 1,
  review_reason: 1,
  reviewed_at: 1,
  completed_at: 1,
  reported_at: 1,
  occurred_at: 1,
  description: 1,
  is_hazard: 1,
  needs_repair: 1,
  follow_up_required: 1,
  temporary_action: 1,
  form_answers: 1,
  dynamic_answers: 1,
  review_history: 1,
  location: 1,
  gps_coords: 1,
  gps_accuracy: 1,
  travel_direction: 1,
  kilometer: 1,
  meter: 1,
  officer: { _id: 1, first_name: 1, last_name: 1, personnel_code: 1 },
  reviewer: { _id: 1, first_name: 1, last_name: 1 },
  patrol_unit: { _id: 1, code: 1, name: 1 },
  vehicle: { _id: 1, plaque_no: 1, title: 1 },
  police_station: { _id: 1, name: 1, code: 1 },
  organization: { _id: 1, name: 1, code: 1 },
  province: { _id: 1, name: 1 },
  city: { _id: 1, name: 1 },
  road: { _id: 1, name: 1, origin: 1, destination: 1 },
  traffic_zone: { _id: 1, name: 1 },
  city_zone: { _id: 1, name: 1 },
  position: { _id: 1, name: 1 },
  incident_severity: { _id: 1, name: 1 },
  light_status: { _id: 1, name: 1 },
  air_statuses: { _id: 1, name: 1 },
  road_defects: { _id: 1, name: 1 },
  equipment_damages: { _id: 1, name: 1 },
  road_surface_conditions: { _id: 1, name: 1 },
  road_situation: { _id: 1, name: 1 },
  shoulder_status: { _id: 1, name: 1 },
  submitted_from: 1,
} as const satisfies IncidentReportGet;

/**
 * Read one report, branching on which collection it lives in.
 *
 * Throws on a refusal rather than resolving to a blank document: a caller who may
 * not see a report should get an error, and `getPatrolErrorMessage` already maps
 * the backend's Persian «گزارش یافت نشد یا دسترسی ندارید» to readable text.
 */
export async function fetchReportDetail(
  reportId: string,
  source: ReportSource,
): Promise<ReportDetailDoc> {
  const token = (await cookies()).get("token");

  const response =
    source === "incident_report"
      ? await AppApi().send(
          {
            service: "main",
            model: "incident_report",
            act: "get",
            details: {
              set: { _id: reportId },
              get: { _id: 1, ...INCIDENT_REPORT_PROJECTION },
            },
          },
          { token: token?.value },
        )
      : await AppApi().send(
          {
            service: "main",
            model: "accident",
            act: "get",
            details: {
              set: { _id: reportId },
              get: { _id: 1, ...ACCIDENT_PROJECTION },
            },
          },
          { token: token?.value },
        );

  const envelope = response as { success?: boolean; body?: unknown };
  if (!envelope?.success) {
    const message =
      (envelope?.body as { message?: string } | null)?.message ??
      "خطا در دریافت اطلاعات";
    throw new Error(message);
  }

  // The one shape difference between the two acts. Normalised here so no caller
  // has to know that `accident.get` answers with an array.
  const body = envelope.body;
  const doc = (Array.isArray(body) ? body[0] : body) as
    | ReportDetailDoc
    | undefined
    | null;

  if (!doc?._id) {
    throw new Error("گزارش یافت نشد یا دسترسی ندارید.");
  }
  return doc;
}