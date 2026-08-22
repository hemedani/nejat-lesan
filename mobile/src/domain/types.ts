export type DeviceMetadata = {
  device_id: string;
  fingerprint: string;
  platform: string;
  app_version: string;
  model: string;
};

export type User = {
  _id: string;
  personnel_code: string;
  first_name: string;
  last_name: string;
  permissions?: string[];
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
  direction?: string;
  kilometer?: number;
  meter?: number;
  nearest_point?: Coordinates;
  distance_to_road?: number;
  lanes?: number;
};

export type ReferenceOption = {
  value: string;
  label: string;
};

export type SyncStatus = 'draft' | 'queued' | 'syncing' | 'synced' | 'rejected';

export type AccidentDraft = {
  client_report_uuid: string;
  sync_status: SyncStatus;
  gps_coords?: Coordinates;
  incident_coords?: Coordinates;
  road_snap?: RoadSnap;
  updated_at: string;
  data: Record<string, unknown>;
};