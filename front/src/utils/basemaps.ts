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

/**
 * The basemaps that are a plain raster `TileLayer`.
 *
 * **Neshan is deliberately absent, and that is not an oversight.** It sets
 * `useSdk: true` with an empty `url` because it is not a tile source at all: it loads
 * its own Leaflet SDK from `static.neshan.org` which *replaces* `window.L`
 * (`components/maps/NeshanMapContainer.tsx`), and `BasemapLayer` returns `null` for it
 * because a `TileLayer` cannot express it.
 *
 * A map that renders `<MapContainer>` — which is every react-leaflet surface,
 * including the report detail page — can therefore only show `osm` and `mapir`.
 * Selecting Neshan there and handing the choice straight to `BasemapLayer` would
 * leave the map's markers and polylines floating on a **blank background**, which is
 * worse than a missing tile. `resolveTileBasemap` is what prevents that.
 *
 * **Reachable from inside Iran:** `mapir` (Map.ir) is. `osm` is served from
 * `tile.openstreetmap.org`, which is unreliable without international internet, so a
 * map that must work there needs a way to switch. That is why this exists and why the
 * report map exposes a selector.
 */
export const TILE_BASEMAPS = ["osm", "mapir"] as const satisfies BasemapType[];

/**
 * The basemap a `MapContainer`-based map should actually render.
 *
 * Anything that is not a tile layer — currently only `neshan` — falls back to
 * `mapir`, an Iranian provider, rather than to `osm`. Falling back to the provider
 * that is unreachable from inside Iran would reproduce the very problem this guards
 * against.
 */
export function resolveTileBasemap(type: BasemapType): BasemapType {
  return (TILE_BASEMAPS as readonly BasemapType[]).includes(type) ? type : "mapir";
}

/** Every entry in `BASEMAPS`, so a satellite source is added in exactly one place. */
export const BASEMAP_TYPES = Object.keys(BASEMAPS) as BasemapType[];

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
