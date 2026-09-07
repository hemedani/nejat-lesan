export type UserLevel = "Ghost" | "Manager" | "OrgHead" | "UnitHead" | "Editor" | "Enterprise" | "Patrol" | null;

export type ModuleKey = "charts" | "incident_patrol" | "warehouse";

export type RoleName = "Ghost" | "Manager" | "OrgHead" | "UnitHead" | "Officer" | "Editor" | "Enterprise" | "Patrol";

export interface UserRole {
  roleId: string;
  name: RoleName;
  scopeType?: "organization" | "unit";
  scopeId?: string;
}

export interface PatrolPermissions {
  can_submit_accident?: boolean;
  can_view_map?: boolean;
  can_receive_announcements?: boolean;
  can_register_emergency?: boolean;
  can_view_reports?: boolean;
}

export interface City {
  _id: string;
  name: string;
  center_location: {
    type: "Point";
    coordinates: [number, number];
  } | null;
}

export interface Province {
  _id: string;
  name: string;
  center_location: {
    type: "Point";
    coordinates: [number, number];
  } | null;
}

export interface ChartPermissions {
  [key: string]: {
    [filter: string]: boolean;
  };
}

export interface EnterpriseSettings {
  cities?: City[];
  provinces?: Province[];
  availableCharts?: ChartPermissions;
}

export interface UserData {
  _id?: string;
  first_name?: string;
  last_name?: string;
  mobile?: string;
  email?: string;
  national_number?: string;
  personnel_code?: string;
  gender?: string;
  level: UserLevel;
  roles?: UserRole[];
  patrol_permissions?: PatrolPermissions;
  settings?: EnterpriseSettings;
  modules?: string[];
  orgModules?: string[];
}

export interface ModuleFeed {
  modules?: string[];
  orgModules?: string[];
}
