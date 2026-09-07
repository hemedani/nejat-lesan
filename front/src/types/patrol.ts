export type SyncStatus = "draft" | "queued" | "syncing" | "synced" | "rejected";
export type ReviewStatus = "submitted" | "under_review" | "returned" | "approved" | "completed";
export type ReviewAction = "start_review" | "return" | "approve" | "complete";

export interface GeoPoint {
  type: "Point";
  coordinates: [number, number];
}

export interface RelatedUser {
  _id?: string;
  first_name?: string;
  last_name?: string;
  personnel_code?: string;
  level?: string;
}

export interface RelatedPatrolUnit {
  _id?: string;
  code?: string;
  name?: string;
}

export interface RelatedVehicle {
  _id?: string;
  plaque_no?: string;
}

export interface RelatedReference {
  _id?: string;
  name?: string;
}

export interface PatrolReport {
  _id: string;
  serial?: number;
  report_id?: string;
  date_of_accident?: string;
  reported_at?: string;
  sync_status?: SyncStatus;
  rejection_reason?: string;
  review_status?: ReviewStatus;
  review_reason?: string;
  reviewed_at?: string;
  completed_at?: string;
  location?: GeoPoint;
  gps_coords?: GeoPoint;
  gps_accuracy?: number;
  travel_direction?: string;
  kilometer?: number;
  meter?: number;
  officer?: RelatedUser;
  reviewer?: RelatedUser;
  patrol_unit?: RelatedPatrolUnit;
  vehicle?: RelatedVehicle;
  type?: RelatedReference;
  collision_type?: RelatedReference;
  road?: RelatedReference;
  police_station?: RelatedReference;
  incident_type?: "accident" | "road_breakdown" | "road_obstacle" | "other";
  incident_payload?: {
    description?: string;
    is_hazard?: boolean;
    needs_repair?: boolean;
    temporary_action?: string;
    follow_up_required?: boolean;
  };
  incident_severity?: RelatedReference;
  attachments?: Array<Record<string, unknown>>;
  vehicle_dtos?: Array<Record<string, unknown>>;
  people_dtos?: Array<Record<string, unknown>>;
  facility_damage_dtos?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface ActiveShift {
  _id?: string;
  shift_type?: string;
  status?: string;
  start_at?: string;
  end_at?: string;
  patrol_unit?: RelatedPatrolUnit;
  vehicle?: RelatedVehicle;
}

export interface StatusSummary {
  sync: Partial<Record<SyncStatus, number>>;
  review: Partial<Record<ReviewStatus, number>>;
}

export interface ReporterDashboardResponse {
  activeShift: ActiveShift | null;
  summary: StatusSummary;
  recentReports: PatrolReport[];
}

export interface ManagerDashboardResponse {
  summary: StatusSummary;
  recentReports: PatrolReport[];
}

export interface ReviewHistoryItem {
  _id: string;
  action: "submitted" | "started_review" | "returned" | "resubmitted" | "approved" | "completed" | "reopened";
  reason?: string;
  action_at?: string;
  reviewer?: RelatedUser;
}
