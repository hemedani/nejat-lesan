import { DeepPartial, ReqType } from "@/types/declarations/selectInp";
import { GetAccidentsSetParams, populateSetSearch } from "./populateSetSearch";
import { gets } from "@/app/actions/accident/gets";
import { gets as getAreaUsages } from "@/app/actions/area_usage/gets";
import { gets as getAirStatuses } from "@/app/actions/air_status/gets";
import { gets as getRoadDefects } from "@/app/actions/road_defect/gets";
import { gets as getHumanReasons } from "@/app/actions/human_reason/gets";
import { gets as getVehicleReasons } from "@/app/actions/vehicle_reason/gets";
import { gets as getEquipmentDamages } from "@/app/actions/equipment_damage/gets";
import { gets as getRoadSurfaceConditions } from "@/app/actions/road_surface_condition/gets";
import { gets as getMaxDamageSections } from "@/app/actions/max_damage_section/gets"; // For vehicleMaxDamageSections

// --- Extend DefaultSearchArrayValues type ---
export type DefaultSearchArrayValueItem = { value: string; label: string };
export type DefaultSearchArrayValues = {
  areaUsages: DefaultSearchArrayValueItem[];
  airStatuses: DefaultSearchArrayValueItem[];
  roadDefects: DefaultSearchArrayValueItem[];
  humanReasons: DefaultSearchArrayValueItem[];
  vehicleReasons: DefaultSearchArrayValueItem[];
  equipmentDamages: DefaultSearchArrayValueItem[];
  roadSurfaceConditions: DefaultSearchArrayValueItem[];
  vehicleMaxDamageSections: DefaultSearchArrayValueItem[];
};

export const prepareAccidentsSearch = async (searchParams: GetAccidentsSetParams) => {
  // populateSetSearch is assumed to correctly process searchParams into structured, typed values.
  // For array fields like areaUsages, it should return string[] (array of names).
  const setSearch: DeepPartial<GetAccidentsSetParams> = populateSetSearch(searchParams);

  // --- Initialize with new fields ---
  const defaultSearchArrayValues: DefaultSearchArrayValues = {
    areaUsages: [],
    airStatuses: [],
    roadDefects: [],
    humanReasons: [],
    vehicleReasons: [],
    equipmentDamages: [],
    roadSurfaceConditions: [],
    vehicleMaxDamageSections: [],
  };

  const setForAccidents: ReqType["main"]["accident"]["gets"]["set"] = {
    page: +(searchParams.page || 1) || 1, // Ensure page is a number, default to 1
    limit: +(searchParams.limit || 20) || 20, // Ensure limit is a number, default to 20
    ...setSearch, // Spread the processed search filters
  };

  const accidents = await gets({
    set: setForAccidents,
    get: { // Projection for the main accidents list
      _id: 1,
      seri: 1,
      serial: 1,
      date_of_accident: 1,
      dead_count: 1,
      injured_count: 1,
      has_witness: 1,
      province: { name: 1 },
      city: { name: 1 },
      type: { name: 1 }, // Accident type
      collision_type: { name: 1 },
      vehicle_dtos: 1, // Include to see vehicle details, adjust if too large
      attachments: { _id: 1, name: 1, type: 1 },
      // Add other fields you commonly display in the list result
    },
  });

  // --- Existing logic for fetching selected array values ---
  if (setSearch?.areaUsages && setSearch.areaUsages.length > 0) {
    const response = await getAreaUsages({
      // Consider if limit should be setSearch.areaUsages.length or if backend supports fetching all by names
      set: { names: setSearch.areaUsages, page: 1, limit: setSearch.areaUsages.length || 10 },
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.areaUsages = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({ value: _id, label: name })
      );
    }
  }

  if (setSearch?.airStatuses && setSearch.airStatuses.length > 0) {
    const response = await getAirStatuses({
      set: { names: setSearch.airStatuses, page: 1, limit: setSearch.airStatuses.length || 10 },
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.airStatuses = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({ value: _id, label: name })
      );
    }
  }

  if (setSearch?.roadDefects && setSearch.roadDefects.length > 0) {
    const response = await getRoadDefects({
      set: { names: setSearch.roadDefects, page: 1, limit: setSearch.roadDefects.length || 10 },
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.roadDefects = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({ value: _id, label: name })
      );
    }
  }

  // --- Add new blocks here ---
  if (setSearch?.humanReasons && setSearch.humanReasons.length > 0) {
    const response = await getHumanReasons({
      set: { names: setSearch.humanReasons, page: 1, limit: setSearch.humanReasons.length || 10 },
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.humanReasons = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({ value: _id, label: name })
      );
    }
  }

  if (setSearch?.vehicleReasons && setSearch.vehicleReasons.length > 0) {
    const response = await getVehicleReasons({
      set: { names: setSearch.vehicleReasons, page: 1, limit: setSearch.vehicleReasons.length || 10 },
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.vehicleReasons = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({ value: _id, label: name })
      );
    }
  }

  if (setSearch?.equipmentDamages && setSearch.equipmentDamages.length > 0) {
    const response = await getEquipmentDamages({
      set: { names: setSearch.equipmentDamages, page: 1, limit: setSearch.equipmentDamages.length || 10 },
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.equipmentDamages = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({ value: _id, label: name })
      );
    }
  }

  if (setSearch?.roadSurfaceConditions && setSearch.roadSurfaceConditions.length > 0) {
    const response = await getRoadSurfaceConditions({
      set: { names: setSearch.roadSurfaceConditions, page: 1, limit: setSearch.roadSurfaceConditions.length || 10 },
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.roadSurfaceConditions = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({ value: _id, label: name })
      );
    }
  }

  if (setSearch?.vehicleMaxDamageSections && setSearch.vehicleMaxDamageSections.length > 0) {
    const response = await getMaxDamageSections({ // Corresponds to max_damage_section model
      set: { names: setSearch.vehicleMaxDamageSections, page: 1, limit: setSearch.vehicleMaxDamageSections.length || 10 },
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.vehicleMaxDamageSections = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({ value: _id, label: name })
      );
    }
  }

  return {
    setSearch, // The processed search parameters
    accidents, // The list of fetched accidents
    defaultSearchArrayValues, // Values for pre-populating select inputs
  };
};
