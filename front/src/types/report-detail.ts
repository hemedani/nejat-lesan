import type { GeoPoint, ReviewStatus, SyncStatus } from "./patrol";

/**
 * Which collection a report row came from.
 *
 * The oversight console merges `accident` and `incident_report` into one table,
 * and nothing in an ObjectId says which. So the kind travels in the URL
 * (`?source=`, written by `reportDetailHref`) rather than in component state — a
 * reload, a bookmark and a link pasted to a colleague all resolve the same record.
 */
export type ReportSource = "accident" | "incident_report";

/** An embedded `{_id, name}` reference snapshot. */
export type Ref = { _id?: string; name?: string };

/**
 * A driver's licence plate.
 *
 * `accident.vehicle_dtos[].plaque_no` is a **tuple of three strings**, while the
 * `vehicle` relation's own `plaque_no` is a single string. Two shapes, one field
 * name, so the reader below accepts both rather than assuming either.
 */
export type PlateTuple = [string, string, string];

export type PassengerDto = {
  first_name?: string;
  last_name?: string;
  sex?: "Male" | "Female" | "Other";
  injury_type?: Ref;
  fault_status?: Ref;
  total_reason?: Ref;
  national_code?: string;
};

export type VehicleDto = {
  /** Tuple on the DTO, plain string on the relation — see `PlateTuple`. */
  plaque_no?: PlateTuple | string;
  color?: Ref;
  system?: Ref;
  system_type?: Ref;
  plaque_type?: Ref;
  plaque_usage?: Ref;
  vehicle_type?: Ref;
  motion_direction?: Ref;
  fault_status?: Ref;
  final_status?: Ref;
  insurance_co?: Ref;
  insurance_no?: string;
  insurance_date?: string;
  body_insurance_co?: Ref;
  body_insurance_no?: string;
  body_insurance_date?: string;
  insurance_warranty_limit?: number;
  print_number?: string;
  plaque_serial?: string[];
  year?: number;
  max_damage_sections?: Ref[];
  damage_section_other?: string;
  passenger_dtos?: PassengerDto[];
  plate_image?: string;
  insurance_image?: string;
  driver?: {
    first_name?: string;
    last_name?: string;
    sex?: "Male" | "Female" | "Other";
    national_code?: string;
    phone?: string;
    licence_number?: string;
    licence_type?: Ref;
    injury_type?: Ref;
    driver_status?: Ref;
    total_reason?: Ref;
  };
};

export type PedestrianDto = {
  first_name?: string;
  last_name?: string;
  sex?: "Male" | "Female" | "Other";
  national_code?: string;
  injury_type?: Ref;
  fault_status?: Ref;
  total_reason?: Ref;
};

export type PeopleDto = {
  role?: Ref;
  first_name?: string;
  last_name?: string;
  sex?: "Male" | "Female" | "Other";
  age?: number;
  age_range?: string;
  injury_status?: Ref;
  national_code?: string;
  phone?: string;
};

export type FacilityDamageDto = {
  asset_group?: Ref;
  asset_code?: string;
  damage_type?: string;
  damage_severity?: Ref;
  quantity?: number;
  unit?: string;
  creates_hazard?: boolean;
  needs_repair?: boolean;
  temporary_action?: string;
  images?: string[];
};

/** A `file` document reached through `accident.attachments`. */
export type AttachmentDto = {
  _id?: string;
  name?: string;
  type?: string;
  size?: number;
  category?: string;
  sequence?: number;
};

/**
 * One row of an embedded `dynamic_answers` array.
 *
 * `question_key` is the field's **instance path**, not its node key —
 * `buildDynamicAnswers` in the shared form engine stores `meta.instancePath`, so a
 * report with two vehicles yields `vehicles[0].plate` and `vehicles[1].plate`.
 */
export type DynamicAnswerRow = {
  step_key?: string;
  question_key: string;
  model_name?: string;
  answer_id?: string;
  answer_ids?: string[];
  answer_name?: string;
  answer_names?: string[];
  value?: string;
};

export type ReviewHistoryItem = {
  _id?: string;
  action:
    | "submitted"
    | "started_review"
    | "returned"
    | "resubmitted"
    | "approved"
    | "completed"
    | "reopened";
  reason?: string;
  action_at?: string;
  reviewer?: { _id?: string; first_name?: string; last_name?: string };
};

/**
 * The union a report detail page renders.
 *
 * Deliberately **not** a normalized shape. `incident_report` has no
 * `vehicle_dtos`, no `people_dtos`, no `attachments` and no `dead_count`; an
 * adapter would either invent fields the collection does not have or drop the
 * ones it does. Each section instead declares which sources it renders for, and
 * the absent half is simply never reached.
 */
export type ReportDetailDoc = {
  _id: string;

  // --- Shared by both models ------------------------------------------------
  report_id?: string;
  serial?: number;
  /**
   * The project's own unions, not `string`.
   *
   * Both models declare these as the same enums (`back/models/accident.ts:98,109`
   * and `incident_report.ts:53,67`), so widening to `string` here would only buy
   * the ability to hold a value neither model can hold — while costing the label
   * maps in `utils/patrol-status.ts` their exhaustive keying.
   */
  sync_status?: SyncStatus;
  rejection_reason?: string;
  review_status?: ReviewStatus;
  review_reason?: string;
  reviewed_at?: string;
  completed_at?: string;
  reported_at?: string;
  occurred_at?: string;
  location?: GeoPoint;
  gps_coords?: GeoPoint;
  gps_accuracy?: number;
  travel_direction?: string;
  kilometer?: number;
  meter?: number;
  officer?: { _id?: string; first_name?: string; last_name?: string; personnel_code?: string };
  reviewer?: { _id?: string; first_name?: string; last_name?: string };
  patrol_unit?: { _id?: string; code?: string; name?: string };
  vehicle?: { _id?: string; plaque_no?: string; title?: string };
  police_station?: { _id?: string; name?: string; code?: string };
  province?: Ref;
  city?: Ref;
  township?: Ref;
  road?: Ref & { origin?: string; destination?: string };
  traffic_zone?: Ref;
  city_zone?: Ref;
  position?: Ref;
  incident_severity?: Ref;
  light_status?: Ref;
  air_statuses?: Ref[];
  road_defects?: Ref[];
  equipment_damages?: Ref[];
  road_surface_conditions?: Ref[];
  road_situation?: Ref;
  shoulder_status?: Ref;
  organization?: { _id?: string; name?: string; code?: string };
  submitted_from?: { app_version?: string; platform?: string };

  // --- accident only --------------------------------------------------------
  dead_count?: number;
  injured_count?: number;
  has_witness?: boolean;
  news_number?: number;
  completion_date?: string;
  incident_type?: "accident" | "road_breakdown" | "road_obstacle" | "other";
  incident_payload?: {
    description?: string;
    is_hazard?: boolean;
    needs_repair?: boolean;
    temporary_action?: string;
    follow_up_required?: boolean;
  };
  type?: Ref;
  collision_type?: Ref;
  croquis_type?: Ref;
  police_present?: boolean;
  police_expert_name?: string;
  police_arrival_time?: string;
  officer_cause_description?: string;
  lane?: Ref;
  area_usages?: Ref[];
  vehicle_dtos?: VehicleDto[];
  pedestrian_dtos?: PedestrianDto[];
  people_dtos?: PeopleDto[];
  facility_damage_dtos?: FacilityDamageDto[];
  attachments?: AttachmentDto[];

  // --- incident_report only -------------------------------------------------
  form_definition_id?: string;
  form_title?: string;
  form_icon?: string;
  form_version?: number;
  description?: string;
  is_hazard?: boolean;
  needs_repair?: boolean;
  follow_up_required?: boolean;
  temporary_action?: string;
  form_answers?: Record<string, unknown>;

  // --- Both -----------------------------------------------------------------
  dynamic_answers?: DynamicAnswerRow[];
  review_history?: ReviewHistoryItem[];
};

/**
 * A licence plate as one string.
 *
 * The DTO stores `["۱۲", "ب", "۳۴۵ ایران ۱۱"]`; the `vehicle` relation stores
 * `"۱۲ ب ۳۴۵ ایران ۱۱"`. Joining the tuple with a space matches how the relation
 * spells it, so both read identically in the card.
 */
export const readPlate = (value: PlateTuple | string | undefined): string | undefined => {
  if (!value) return undefined;
  if (typeof value === "string") return value.trim() || undefined;
  const parts = value.filter((part) => typeof part === "string" && part.trim());
  return parts.length ? parts.join(" ") : undefined;
};