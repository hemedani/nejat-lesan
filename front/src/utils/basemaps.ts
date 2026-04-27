export type BasemapType = "osm" | "mapir";

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
    url: `https://map.ir/tile/{z}/{x}/{y}?token=${process.env.NEXT_PUBLIC_MAP_IR_TOKEN}`,
    attribution: '&copy; <a href="https://map.ir">نقشه ایران</a>',
  },
};

export const DEFAULT_BASEMAP: BasemapType = "mapir";

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

  return basemap.url;
};