export type BasemapType = "osm" | "mapir" | "neshan";

export interface BasemapConfig {
  id: BasemapType;
  name: string;
  nameEn: string;
  url: string;
  attribution: string;
  useSdk?: boolean;
}

export const BASEMAPS: Record<BasemapType, BasemapConfig> = {
  osm: {
    id: "osm",
    name: "نقشه استاندارد",
    nameEn: "Standard Map",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  mapir: {
    id: "mapir",
    name: "نقشه ایران",
    nameEn: "Iran Map",
    url: "https://map.ir/shiveh/xyz/1.0.0/Shiveh:Shiveh@EPSG:3857@png/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://map.ir">نقشه ایران</a>',
  },
  neshan: {
    id: "neshan",
    name: "نقشه نشان",
    nameEn: "Neshan Map",
    url: "",
    attribution: '&copy; <a href="https://neshan.org">نقشه نشان</a>',
    useSdk: true,
  },
};

export const DEFAULT_BASEMAP: BasemapType = "osm";

export const getBasemapUrl = (type: BasemapType): string => {
  const basemap = BASEMAPS[type];
  if (!basemap) return BASEMAPS.osm.url;

  if (type === "neshan") return "";

  if (type === "mapir") {
    const token = process.env.NEXT_PUBLIC_MAP_IR_TOKEN;
    if (!token) {
      console.warn("NEXT_PUBLIC_MAP_IR_TOKEN is not set, falling back to OSM");
      return BASEMAPS.osm.url;
    }
    return `https://map.ir/shiveh/xyz/1.0.0/Shiveh:Shiveh@EPSG:3857@png/{z}/{x}/{y}.png?x-api-key=${token}`;
  }

  return basemap.url;
};
