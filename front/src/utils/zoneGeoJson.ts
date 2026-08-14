// =========================================================================
// src/utils/zoneGeoJson.ts
// Shared helpers for loading and styling zone polygon overlays
// (city zones, traffic zones, air pollution zones) across all maps.
// =========================================================================

import { getCityZonesGeoJSON, getCityZonesGeoJSONByNames } from "@/app/actions/city/getCityZones";
import { getTrafficZonesGeoJSON } from "@/app/actions/traffic_zone/getTrafficZonesGeoJSON";
import { getAirPollutionZonesGeoJSON } from "@/app/actions/air_pollution_zone/getAirPollutionZonesGeoJSON";
import type { ChartFilterState } from "@/components/dashboards/ChartsFilterSidebar";
import { GeoJsonData } from "@/types/GeoJsonTypes";

export type ZoneType = "cityZone" | "trafficZone" | "airPollutionZone";

export const ZONE_TYPE_ORDER: ZoneType[] = ["cityZone", "trafficZone", "airPollutionZone"];

export const ZONE_TYPE_STYLES: Record<ZoneType, { fillColor: string; color: string }> = {
  cityZone: { fillColor: "#3b82f6", color: "#1d4ed8" },
  trafficZone: { fillColor: "#10b981", color: "#047857" },
  airPollutionZone: { fillColor: "#8b5cf6", color: "#6d28d9" },
};

// Neutral outline used on spatial chart maps so zone overlays don't obscure
// the ratio-based coloring of city zones.
export const ZONE_OUTLINE_STYLES: Record<ZoneType, { fillColor: string; color: string }> = {
  cityZone: { fillColor: "#3b82f6", color: "#1d4ed8" },
  trafficZone: { fillColor: "#10b981", color: "#047857" },
  airPollutionZone: { fillColor: "#8b5cf6", color: "#6d28d9" },
};

export const getZoneType = (
  feature?: Record<string, unknown> | null,
): ZoneType | null => {
  const properties = feature?.properties as Record<string, unknown> | undefined;
  const zoneType = properties?.zoneType;
  return ZONE_TYPE_ORDER.includes(zoneType as ZoneType) ? (zoneType as ZoneType) : null;
};

export const isZoneOverlay = (feature?: Record<string, unknown> | null): boolean =>
  getZoneType(feature) !== null;

// Solid overlay style used on the interactive accident map. Each zone type
// renders in a distinct color while city zones keep the current blue look.
export const zoneGeoJsonStyle = (
  feature?: Record<string, unknown> | null,
): Record<string, unknown> => {
  const zoneType = getZoneType(feature);
  if (!zoneType) {
    return {
      fillColor: "#3b82f6",
      weight: 2,
      opacity: 1,
      color: "#1d4ed8",
      fillOpacity: 0.1,
    };
  }
  const { fillColor, color } = ZONE_TYPE_STYLES[zoneType];
  return {
    fillColor,
    weight: 2,
    opacity: 1,
    color,
    fillOpacity: 0.15,
  };
};

// Neutral outline style for zone overlays on spatial chart maps, so they do
// not interfere with the ratio-based coloring of city zones. City zones keep
// their ratio-based coloring, so this returns null for them.
export const zoneOutlineStyle = (
  feature?: Record<string, unknown> | null,
): Record<string, unknown> | null => {
  const zoneType = getZoneType(feature);
  if (!zoneType || zoneType === "cityZone") return null;
  const { fillColor, color } = ZONE_OUTLINE_STYLES[zoneType];
  return {
    fillColor,
    weight: 1.5,
    opacity: 0.8,
    color,
    fillOpacity: 0.05,
    dashArray: "4 4",
  };
};

export interface GeoJsonResult {
  success: boolean;
  body?: { type: string; features: unknown[] };
}

// Fetch polygon overlays for every zone filter that is currently active and
// merge them into a single FeatureCollection. Returns null when no zone-based
// filter is selected.
export const loadZoneGeoJson = async (filters: ChartFilterState): Promise<GeoJsonData | null> => {
  const hasZoneFilter =
    (filters.city && filters.city.length > 0) ||
    (filters.cityZone && filters.cityZone.length > 0) ||
    (filters.trafficZone && filters.trafficZone.length > 0) ||
    (filters.airPollutionZone && filters.airPollutionZone.length > 0);

  if (!hasZoneFilter) return null;

  const requests: Promise<GeoJsonResult>[] = [];

  if (filters.city && filters.city.length > 0) {
    requests.push(getCityZonesGeoJSON(filters.city));
  }

  if (filters.cityZone && filters.cityZone.length > 0) {
    requests.push(getCityZonesGeoJSONByNames(filters.cityZone));
  }

  if (filters.trafficZone && filters.trafficZone.length > 0) {
    requests.push(getTrafficZonesGeoJSON(filters.trafficZone));
  }

  if (filters.airPollutionZone && filters.airPollutionZone.length > 0) {
    requests.push(getAirPollutionZonesGeoJSON(filters.airPollutionZone));
  }

  const results = await Promise.all(requests);

  const features: unknown[] = [];
  const seenIds = new Set<string>();

  for (const result of results) {
    if (!result.success || !result.body || !Array.isArray(result.body.features)) continue;
    for (const feature of result.body.features) {
      const id = (feature as { properties?: { id?: string } }).properties?.id;
      if (id && seenIds.has(id)) continue;
      if (id) seenIds.add(id);
      features.push(feature);
    }
  }

  if (features.length === 0) return null;

  return {
    type: "FeatureCollection",
    features,
  };
};
