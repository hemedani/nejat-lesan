// =========================================================================
// src/utils/geoRelations.ts
// Single source of truth for geo-spatial filter relations.
//
// Relation graph (see GEOSPATIAL_RELATIONS.md):
//   province → city → city_zone
//   province → road
//   traffic_zone is intentionally independent (backend cascade comes later).
//
// All filter values are stored as NAMES (matching the analytics API). The
// province index (name → id) is fetched once and cached at module level so
// dependent loaders (city/road/zone) never race against a cold cache.
// =========================================================================

"use client";

import { gets as getProvincesAction } from "@/app/actions/province/gets";
import { gets as getCitiesAction } from "@/app/actions/city/gets";
import { gets as getRoadsAction } from "@/app/actions/road/gets";
import { gets as getCityZonesAction } from "@/app/actions/city_zone/gets";
import { gets as getTrafficZonesAction } from "@/app/actions/traffic_zone/gets";
import type { ReqType } from "@/types/declarations/selectInp";
import type { SelectOption } from "@/components/atoms/MyAsyncMultiSelect";
import type { ChartFilterState } from "@/components/dashboards/ChartsFilterSidebar";

// ---------------------------------------------------------------------------
// Province index (name → id + options), fetched once per session
// ---------------------------------------------------------------------------

export interface ProvinceIndex {
  byName: Record<string, string>;
  options: SelectOption[];
}

interface ProvinceRow {
  _id?: string;
  name?: string;
}

let provinceIndexPromise: Promise<ProvinceIndex> | null = null;

function ensureProvinceIndex(): Promise<ProvinceIndex> {
  if (!provinceIndexPromise) {
    provinceIndexPromise = getProvincesAction({
      set: { page: 1, limit: 500 },
      get: { _id: 1, name: 1 },
    })
      .then((res) => {
        const byName: Record<string, string> = {};
        const options: SelectOption[] = [];
        const rows: ProvinceRow[] = res.success && Array.isArray(res.body) ? res.body : [];
        for (const p of rows) {
          if (p._id && p.name) {
            byName[p.name] = p._id;
            options.push({ value: p.name, label: p.name });
          }
        }
        return { byName, options };
      })
      .catch(() => ({ byName: {}, options: [] }));
  }
  return provinceIndexPromise;
}

// ---------------------------------------------------------------------------
// Geo membership index (for reconciling saved filters with their parents)
// ---------------------------------------------------------------------------

export interface GeoMembershipIndex {
  citiesByProvince: Record<string, Set<string>>;
  roadsByProvince: Record<string, Set<string>>;
  zonesByCity: Record<string, Set<string>>;
}

type NameRow = { _id?: string; name?: string };
type CityIndexRow = NameRow & { province?: NameRow };
type RoadIndexRow = NameRow & { province?: NameRow };
type ZoneIndexRow = NameRow & { city?: NameRow };

const EMPTY_INDEX: GeoMembershipIndex = {
  citiesByProvince: {},
  roadsByProvince: {},
  zonesByCity: {},
};

let geoIndexPromise: Promise<GeoMembershipIndex> | null = null;

function ensureGeoIndex(): Promise<GeoMembershipIndex> {
  if (!geoIndexPromise) {
    geoIndexPromise = Promise.all([
      getCitiesAction({
        set: { page: 1, limit: 10000 },
        get: { _id: 1, name: 1, province: { _id: 1, name: 1 } },
      }),
      getRoadsAction({
        set: { page: 1, limit: 10000 },
        get: { _id: 1, name: 1, province: { _id: 1, name: 1 } },
      }),
      getCityZonesAction({
        set: { page: 1, limit: 10000 },
        get: { _id: 1, name: 1, city: { _id: 1, name: 1 } },
      }),
    ])
      .then(([citiesRes, roadsRes, zonesRes]) => {
        const citiesByProvince: Record<string, Set<string>> = {};
        const roadsByProvince: Record<string, Set<string>> = {};
        const zonesByCity: Record<string, Set<string>> = {};

        const cities: CityIndexRow[] =
          citiesRes.success && Array.isArray(citiesRes.body) ? citiesRes.body : [];
        const roads: RoadIndexRow[] =
          roadsRes.success && Array.isArray(roadsRes.body) ? roadsRes.body : [];
        const zones: ZoneIndexRow[] =
          zonesRes.success && Array.isArray(zonesRes.body) ? zonesRes.body : [];

        for (const c of cities) {
          if (c.name && c.province?.name) {
            (citiesByProvince[c.province.name] ||= new Set()).add(c.name);
          }
        }
        for (const r of roads) {
          if (r.name && r.province?.name) {
            (roadsByProvince[r.province.name] ||= new Set()).add(r.name);
          }
        }
        for (const z of zones) {
          if (z.name && z.city?.name) {
            (zonesByCity[z.city.name] ||= new Set()).add(z.name);
          }
        }

        return { citiesByProvince, roadsByProvince, zonesByCity };
      })
      .catch(() => EMPTY_INDEX);
  }
  return geoIndexPromise;
}

// ---------------------------------------------------------------------------
// Option loaders (server-backed, province-filtered via cached ids)
// ---------------------------------------------------------------------------

async function resolveProvinceIds(provinceNames: string[] | undefined): Promise<string[]> {
  if (!provinceNames || provinceNames.length === 0) return [];
  const { byName } = await ensureProvinceIndex();
  return provinceNames.map((n) => byName[n]).filter(Boolean);
}

function toOptions<T extends { name: string }>(rows: T[]): SelectOption[] {
  return rows.map((r) => ({ value: r.name, label: r.name }));
}

export async function loadProvinces(inputValue?: string): Promise<SelectOption[]> {
  const { options } = await ensureProvinceIndex();
  if (!inputValue) return options;
  const q = inputValue.trim();
  return q ? options.filter((o) => o.label.includes(q)) : options;
}

export async function loadCities(
  provinceNames: string[] | undefined,
  inputValue?: string,
): Promise<SelectOption[]> {
  const set: ReqType["main"]["city"]["gets"]["set"] = { page: 1, limit: 20 };
  if (inputValue) set.name = inputValue;
  const provinceIds = await resolveProvinceIds(provinceNames);
  if (provinceIds.length > 0) set.provinceIds = provinceIds;
  try {
    const res = await getCitiesAction({ set, get: { _id: 1, name: 1 } });
    return res.success && Array.isArray(res.body)
      ? toOptions(res.body as { name: string }[])
      : [];
  } catch {
    return [];
  }
}

export async function loadRoads(
  provinceNames: string[] | undefined,
  inputValue?: string,
): Promise<SelectOption[]> {
  const set: ReqType["main"]["road"]["gets"]["set"] = { page: 1, limit: 20 };
  if (inputValue) set.name = inputValue;
  const provinceIds = await resolveProvinceIds(provinceNames);
  if (provinceIds.length > 0) set.provinceIds = provinceIds;
  try {
    const res = await getRoadsAction({ set, get: { _id: 1, name: 1 } });
    return res.success && Array.isArray(res.body)
      ? toOptions(res.body as { name: string }[])
      : [];
  } catch {
    return [];
  }
}

export async function loadCityZones(
  provinceNames: string[] | undefined,
  cityNames: string[] | undefined,
  inputValue?: string,
): Promise<SelectOption[]> {
  const set: ReqType["main"]["city_zone"]["gets"]["set"] = { page: 1, limit: 20 };
  if (inputValue) set.name = inputValue;
  const provinceIds = await resolveProvinceIds(provinceNames);
  if (provinceIds.length > 0) set.provinceIds = provinceIds;
  if (cityNames && cityNames.length > 0) set.cityNames = cityNames;
  try {
    const res = await getCityZonesAction({ set, get: { _id: 1, name: 1 } });
    return res.success && Array.isArray(res.body)
      ? toOptions(res.body as { name: string }[])
      : [];
  } catch {
    return [];
  }
}

export async function loadTrafficZones(inputValue?: string): Promise<SelectOption[]> {
  const set: ReqType["main"]["traffic_zone"]["gets"]["set"] = { page: 1, limit: 20 };
  if (inputValue) set.name = inputValue;
  try {
    const res = await getTrafficZonesAction({ set, get: { _id: 1, name: 1 } });
    return res.success && Array.isArray(res.body)
      ? toOptions(res.body as { name: string }[])
      : [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Filter reconciliation
// ---------------------------------------------------------------------------

function prune(set: Set<string>, values: string[] | undefined): string[] | undefined {
  if (!values || values.length === 0) return undefined;
  const valid = values.filter((v) => set.has(v));
  return valid.length > 0 ? valid : undefined;
}

/**
 * Drops geo children (city/road/city_zone) that are inconsistent with the
 * selected parents. Used before persisting global filters and on rehydrate so
 * stale localStorage combos never produce empty analytics results.
 */
export async function normalizeGeoFilters(
  filters: ChartFilterState,
): Promise<ChartFilterState> {
  const provinces = filters.province;
  const cities = filters.city;
  const roads = filters.road;
  const zones = filters.cityZone;

  if (!provinces && !cities && !roads && !zones) return filters;

  // Without a selected province, children are independent → nothing to reconcile.
  if (!provinces || provinces.length === 0) return filters;

  const next: ChartFilterState = { ...filters };
  const index = await ensureGeoIndex();

  // If the membership index could not be built (e.g. transient API failure),
  // fail open and keep the current filters untouched instead of dropping them.
  if (Object.keys(index.citiesByProvince).length === 0) return filters;

  // City must belong to one of the selected provinces.
  if (cities && cities.length > 0) {
    const validCities = new Set<string>();
    for (const p of provinces) {
      const set = index.citiesByProvince[p];
      if (set) for (const c of set) validCities.add(c);
    }
    const kept = prune(validCities, cities);
    if (kept) next.city = kept;
    else delete next.city;
  }

  // Road must belong to one of the selected provinces.
  if (roads && roads.length > 0) {
    const validRoads = new Set<string>();
    for (const p of provinces) {
      const set = index.roadsByProvince[p];
      if (set) for (const r of set) validRoads.add(r);
    }
    const kept = prune(validRoads, roads);
    if (kept) next.road = kept;
    else delete next.road;
  }

  // City zone must belong to one of the selected cities (or, if no city is
  // selected, to a city that lives inside a selected province).
  if (zones && zones.length > 0) {
    const validZones = new Set<string>();
    const zoneCities = cities && cities.length > 0 ? cities : [];
    if (zoneCities.length > 0) {
      for (const c of zoneCities) {
        const set = index.zonesByCity[c];
        if (set) for (const z of set) validZones.add(z);
      }
    } else {
      for (const p of provinces) {
        const citySet = index.citiesByProvince[p];
        if (!citySet) continue;
        for (const c of citySet) {
          const zoneSet = index.zonesByCity[c];
          if (zoneSet) for (const z of zoneSet) validZones.add(z);
        }
      }
    }
    const kept = prune(validZones, zones);
    if (kept) next.cityZone = kept;
    else delete next.cityZone;
  }

  return next;
}
