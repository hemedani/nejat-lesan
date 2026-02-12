export type UserLevel = "Ghost" | "Manager" | "Editor" | "Enterprise" | null;

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
  national_number?: string;
  gender?: string;
  level: UserLevel;
  settings?: EnterpriseSettings;
}
