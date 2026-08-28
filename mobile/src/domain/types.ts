export type DeviceMetadata = {
  device_id: string;
  fingerprint: string;
  platform: string;
  app_version: string;
  model: string;
};

export type PatrolPermissions = {
  can_submit_accident?: boolean;
  can_view_map?: boolean;
  can_receive_announcements?: boolean;
  can_register_emergency?: boolean;
  can_view_reports?: boolean;
};

export type User = {
  _id: string;
  personnel_code?: string;
  first_name: string;
  last_name: string;
  permissions?: PatrolPermissions;
};

export type Session = {
  token: string;
  user: User;
  device_id: string;
};

export type PatrolUnit = {
  _id: string;
  title: string;
  code?: string;
};

export type Vehicle = {
  _id: string;
  title: string;
  plate_number?: string;
};

export type ActiveShift = {
  _id: string;
  shift_type: string;
  starts_at: string;
  ends_at: string;
  status: string;
  patrol_unit?: PatrolUnit;
  vehicle?: Vehicle;
};

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type RoadSnap = {
  road_id: string;
  road_name?: string;
  direction?: string | null;
  kilometer?: number;
  meter?: number;
  from_origin_meters?: number;
  total_length_meters?: number;
  nearest_point?: Coordinates;
  distance_to_road_meters?: number;
  lanes?: unknown[];
};

export type ZoneCheckRecord = {
  in_zone: boolean;
  reason?: string;
  police_station?: string;
  checked_at: string;
};

export type ReferenceOption = {
  value: string;
  label: string;
};

export type SyncStatus = 'draft' | 'queued' | 'syncing' | 'synced' | 'rejected';

export type QueueRecord = {
  id: string;
  client_report_uuid: string;
  status: SyncStatus;
  attempts: number;
  next_retry_at?: string;
  last_error?: string;
  updated_at: string;
};

export type AccidentDraft = {
  client_report_uuid: string;
  schema_version: number;
  sync_status: SyncStatus;
  gps_coords?: Coordinates;
  incident_coords?: Coordinates;
  road_snap?: RoadSnap;
  gps_unavailable?: boolean;
  server_id?: string;
  report_id?: string;
  rejection_reason?: string;
  updated_at: string;
  data: Record<string, unknown>;
};