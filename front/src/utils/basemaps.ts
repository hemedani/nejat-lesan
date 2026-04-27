export type BasemapType = "osm" | "mapir" | "neshan";

export interface BasemapConfig {
  id: BasemapType;
  name: string;
  nameEn: string;
  url: string;
  attribution: string;
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
    url: "https://map.ir/tile/{z}/{x}/{y}",
    attribution: '&copy; <a href="https://map.ir">نقشه ایران</a>',
  },
  neshan: {
    id: "neshan",
    name: "نقشه نشان",
    nameEn: "Neshan Map",
    url: "https://tile.neshan.org/tile/{z}/{x}/{y}",
    attribution: '&copy; <a href="https://neshan.org">نقشه نشان</a>',
  },
};

export const DEFAULT_BASEMAP: BasemapType = "osm";

export const getBasemapUrl = (type: BasemapType): string => {
  const basemap = BASEMAPS[type];
  if (!basemap) return BASEMAPS.osm.url;

  if (type === "mapir") {
    const token = process.env.NEXT_PUBLIC_MAP_IR_TOKEN;
    if (!token) {
      console.warn("NEXT_PUBLIC_MAP_IR_TOKEN is not set, falling back to OSM");
      return BASEMAPS.osm.url;
    }
    return `https://map.ir/tile/{z}/{x}/{y}?token=${token}`;
  }

  if (type === "neshan") {
    const apiKey = process.env.NEXT_PUBLIC_NESHAN_API_KEY;
    if (!apiKey) {
      console.warn("NEXT_PUBLIC_NESHAN_API_KEY is not set, falling back to OSM");
      return BASEMAPS.osm.url;
    }
    return `https://tile.neshan.org/tile/{z}/{x}/{y}?key=${apiKey}`;
  }

  return basemap.url;
};