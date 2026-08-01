// =========================================================================
// src/components/dashboards/GeographicFiltersGroup.tsx
// Shared, fully-controlled geographic filter selects with onChange-based
// cascade clearing. Used by both ChartsFilterSidebar and GlobalFiltersBar
// so the province → city → city_zone / province → road relations live in
// exactly one place (no duplicated reactive cascade logic).
//
// traffic_zone is intentionally independent (see src/utils/geoRelations.ts).
// =========================================================================

"use client";

import React from "react";
import { Control, FieldErrors, Path, PathValue, useWatch, UseFormSetValue } from "react-hook-form";
import MyAsyncMultiSelect, { SelectOption } from "../atoms/MyAsyncMultiSelect";
import {
  loadCities,
  loadCityZones,
  loadProvinces,
  loadRoads,
  loadTrafficZones,
} from "@/utils/geoRelations";
import type { ChartFilterState } from "./ChartsFilterSidebar";

interface GeographicFiltersGroupProps {
  enabledFilters: Array<keyof ChartFilterState>;
  control: Control<ChartFilterState>;
  setValue: UseFormSetValue<ChartFilterState>;
  errors?: FieldErrors<ChartFilterState>;
}

type GeoKey = "province" | "city" | "road" | "trafficZone" | "cityZone";

export default function GeographicFiltersGroup({
  enabledFilters,
  control,
  setValue,
  errors,
}: GeographicFiltersGroupProps) {
  const watchedProvince = useWatch({ control, name: "province" });
  const watchedCity = useWatch({ control, name: "city" });
  const watchedRoad = useWatch({ control, name: "road" });
  const watchedTrafficZone = useWatch({ control, name: "trafficZone" });
  const watchedCityZone = useWatch({ control, name: "cityZone" });

  const enabled = (key: GeoKey) => enabledFilters.includes(key);

  const toOptions = (values?: string[]): SelectOption[] | undefined =>
    values && values.length > 0 ? values.map((v) => ({ value: v, label: v })) : undefined;

  const setForm = (key: GeoKey, values: string[]) =>
    setValue(
      key as Path<ChartFilterState>,
      (values.length > 0 ? values : undefined) as PathValue<
        ChartFilterState,
        Path<ChartFilterState>
      >,
    );

  // Cascade clearing lives in the onChange handlers (not a reactive effect):
  // province change → city/road/city_zone cleared; city change → city_zone cleared.
  const handleProvinceChange = (values: string[]) => {
    setForm("province", values);
    setForm("city", []);
    setForm("road", []);
    setForm("cityZone", []);
  };

  const handleCityChange = (values: string[]) => {
    setForm("city", values);
    setForm("cityZone", []);
  };

  const handleRoadChange = (values: string[]) => setForm("road", values);
  const handleTrafficZoneChange = (values: string[]) => setForm("trafficZone", values);
  const handleCityZoneChange = (values: string[]) => setForm("cityZone", values);

  const provinceKey = (watchedProvince || []).join(",");
  const cityKey = (watchedCity || []).join(",");

  return (
    <div className="grid grid-cols-1 gap-4 mb-4">
      {enabled("province") && (
        <MyAsyncMultiSelect
          name="province"
          label="استان"
          setValue={setValue}
          onChange={handleProvinceChange}
          loadOptions={loadProvinces}
          errMsg={errors?.province?.message}
          placeholder="انتخاب استان..."
          defaultOptions
          value={toOptions(watchedProvince)}
        />
      )}
      {enabled("city") && (
        <MyAsyncMultiSelect
          key={`city-${provinceKey}`}
          name="city"
          label="شهر"
          setValue={setValue}
          onChange={handleCityChange}
          loadOptions={(input) => loadCities(watchedProvince, input)}
          errMsg={errors?.city?.message}
          placeholder="انتخاب شهر..."
          defaultOptions
          value={toOptions(watchedCity)}
        />
      )}
      {enabled("road") && (
        <MyAsyncMultiSelect
          key={`road-${provinceKey}`}
          name="road"
          label="راه"
          setValue={setValue}
          onChange={handleRoadChange}
          loadOptions={(input) => loadRoads(watchedProvince, input)}
          errMsg={errors?.road?.message}
          placeholder="انتخاب راه..."
          defaultOptions
          value={toOptions(watchedRoad)}
        />
      )}
      {enabled("trafficZone") && (
        <MyAsyncMultiSelect
          name="trafficZone"
          label="منطقه ترافیکی"
          setValue={setValue}
          onChange={handleTrafficZoneChange}
          loadOptions={loadTrafficZones}
          errMsg={errors?.trafficZone?.message}
          placeholder="انتخاب منطقه ترافیکی..."
          defaultOptions
          value={toOptions(watchedTrafficZone)}
        />
      )}
      {enabled("cityZone") && (
        <MyAsyncMultiSelect
          key={`cityZone-${cityKey}`}
          name="cityZone"
          label="منطقه شهری"
          setValue={setValue}
          onChange={handleCityZoneChange}
          loadOptions={(input) => loadCityZones(watchedProvince, watchedCity, input)}
          errMsg={errors?.cityZone?.message}
          placeholder="انتخاب منطقه شهری..."
          defaultOptions
          value={toOptions(watchedCityZone)}
        />
      )}
    </div>
  );
}
