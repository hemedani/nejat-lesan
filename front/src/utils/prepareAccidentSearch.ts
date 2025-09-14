/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { gets as getProvinces } from "@/app/actions/province/gets";
import { gets as getCities } from "@/app/actions/city/gets";
import { gets as getTownships } from "@/app/actions/township/gets";
import { gets as getRoads } from "@/app/actions/road/gets";
import { gets as getTrafficZones } from "@/app/actions/traffic_zone/gets";
import { gets as getCityZones } from "@/app/actions/city_zone/gets";
import { gets as getTypes } from "@/app/actions/type/gets"; // For accidentType
import { gets as getPositions } from "@/app/actions/position/gets";
import { gets as getRulingTypes } from "@/app/actions/ruling_type/gets";
import { gets as getLightStatuses } from "@/app/actions/light_status/gets";
import { gets as getCollisionTypes } from "@/app/actions/collision_type/gets";
import { gets as getRoadSituations } from "@/app/actions/road_situation/gets";
import { gets as getRoadRepairTypes } from "@/app/actions/road_repair_type/gets";
import { gets as getShoulderStatuses } from "@/app/actions/shoulder_status/gets";
import { gets as getColors } from "@/app/actions/color/gets"; // For vehicleColor
import { gets as getSystems } from "@/app/actions/system/gets"; // For vehicleSystem
import { gets as getPlaqueTypes } from "@/app/actions/plaque_type/gets"; // For vehiclePlaqueType
import { gets as getSystemTypes } from "@/app/actions/system_type/gets"; // For vehicleSystemType
import { gets as getFaultStatuses } from "@/app/actions/fault_status/gets"; // For vehicle/passenger/pedestrian fault status
import { gets as getInsuranceCos } from "@/app/actions/insurance_co/gets"; // For vehicleInsuranceCo
import { gets as getPlaqueUsages } from "@/app/actions/plaque_usage/gets"; // For vehiclePlaqueUsage
import { gets as getBodyInsuranceCos } from "@/app/actions/body_insurance_co/gets"; // For vehicleBodyInsuranceCo
import { gets as getMotionDirections } from "@/app/actions/motion_direction/gets"; // For vehicleMotionDirection
import { gets as getLicenceTypes } from "@/app/actions/licence_type/gets"; // For driverLicenceType

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
  province: DefaultSearchArrayValueItem[];
  city: DefaultSearchArrayValueItem[];
  township: DefaultSearchArrayValueItem[];
  road: DefaultSearchArrayValueItem[];
  trafficZone: DefaultSearchArrayValueItem[];
  cityZone: DefaultSearchArrayValueItem[];
  accidentType: DefaultSearchArrayValueItem[];
  position: DefaultSearchArrayValueItem[];
  rulingType: DefaultSearchArrayValueItem[];
  lightStatus: DefaultSearchArrayValueItem[];
  collisionType: DefaultSearchArrayValueItem[];
  roadSituation: DefaultSearchArrayValueItem[];
  roadRepairType: DefaultSearchArrayValueItem[];
  shoulderStatus: DefaultSearchArrayValueItem[];
  vehicleColor: DefaultSearchArrayValueItem[];
  vehicleSystem: DefaultSearchArrayValueItem[];
  vehiclePlaqueType: DefaultSearchArrayValueItem[];
  vehicleSystemType: DefaultSearchArrayValueItem[];
  vehicleFaultStatus: DefaultSearchArrayValueItem[];
  vehicleInsuranceCo: DefaultSearchArrayValueItem[];
  vehiclePlaqueUsage: DefaultSearchArrayValueItem[];
  vehicleBodyInsuranceCo: DefaultSearchArrayValueItem[];
  vehicleMotionDirection: DefaultSearchArrayValueItem[];
  driverLicenceType: DefaultSearchArrayValueItem[];
  passengerFaultStatus: DefaultSearchArrayValueItem[];
  pedestrianFaultStatus: DefaultSearchArrayValueItem[];
};

export const prepareAccidentsSearch = async (
  searchParams: GetAccidentsSetParams,
) => {
  // populateSetSearch is assumed to correctly process searchParams into structured, typed values.
  // For array fields like areaUsages, it should return string[] (array of names).
  const setSearch: DeepPartial<GetAccidentsSetParams> =
    populateSetSearch(searchParams);

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
    province: [],
    city: [],
    township: [],
    road: [],
    trafficZone: [],
    cityZone: [],
    accidentType: [],
    position: [],
    rulingType: [],
    lightStatus: [],
    collisionType: [],
    roadSituation: [],
    roadRepairType: [],
    shoulderStatus: [],
    vehicleColor: [],
    vehicleSystem: [],
    vehiclePlaqueType: [],
    vehicleSystemType: [],
    vehicleFaultStatus: [],
    vehicleInsuranceCo: [],
    vehiclePlaqueUsage: [],
    vehicleBodyInsuranceCo: [],
    vehicleMotionDirection: [],
    driverLicenceType: [],
    passengerFaultStatus: [],
    pedestrianFaultStatus: [],
  };

  const setForAccidents: ReqType["main"]["accident"]["gets"]["set"] = {
    page: +(searchParams.page || 1) || 1, // Ensure page is a number, default to 1
    limit: +(searchParams.limit || 20) || 20, // Ensure limit is a number, default to 20
    ...setSearch, // Spread the processed search filters
  };

  const accidents = await gets({
    set: setForAccidents,
    get: {
      // Projection for the main accidents list
      _id: 1,
      seri: 1,
      serial: 1,
      date_of_accident: 1,
      dead_count: 1,
      injured_count: 1,
      has_witness: 1,
      province: { name: 1 },
      city: { name: 1 },
      township: { name: 1 },
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
      set: {
        names: setSearch.areaUsages,
        page: 1,
        limit: setSearch.areaUsages.length || 10,
      },
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.areaUsages = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  if (setSearch?.airStatuses && setSearch.airStatuses.length > 0) {
    const response = await getAirStatuses({
      set: {
        names: setSearch.airStatuses,
        page: 1,
        limit: setSearch.airStatuses.length || 10,
      },
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.airStatuses = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  if (setSearch?.roadDefects && setSearch.roadDefects.length > 0) {
    const response = await getRoadDefects({
      set: {
        names: setSearch.roadDefects,
        page: 1,
        limit: setSearch.roadDefects.length || 10,
      },
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.roadDefects = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  // --- Add new blocks here ---
  if (setSearch?.humanReasons && setSearch.humanReasons.length > 0) {
    const response = await getHumanReasons({
      set: {
        names: setSearch.humanReasons,
        page: 1,
        limit: setSearch.humanReasons.length || 10,
      },
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.humanReasons = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  if (setSearch?.vehicleReasons && setSearch.vehicleReasons.length > 0) {
    const response = await getVehicleReasons({
      set: {
        names: setSearch.vehicleReasons,
        page: 1,
        limit: setSearch.vehicleReasons.length || 10,
      },
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.vehicleReasons = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  if (setSearch?.equipmentDamages && setSearch.equipmentDamages.length > 0) {
    const response = await getEquipmentDamages({
      set: {
        names: setSearch.equipmentDamages,
        page: 1,
        limit: setSearch.equipmentDamages.length || 10,
      },
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.equipmentDamages = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  if (
    setSearch?.roadSurfaceConditions &&
    setSearch.roadSurfaceConditions.length > 0
  ) {
    const response = await getRoadSurfaceConditions({
      set: {
        names: setSearch.roadSurfaceConditions,
        page: 1,
        limit: setSearch.roadSurfaceConditions.length || 10,
      },
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.roadSurfaceConditions = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  if (
    setSearch?.vehicleMaxDamageSections &&
    setSearch.vehicleMaxDamageSections.length > 0
  ) {
    const response = await getMaxDamageSections({
      // Corresponds to max_damage_section model
      set: {
        names: setSearch.vehicleMaxDamageSections,
        page: 1,
        limit: setSearch.vehicleMaxDamageSections.length || 10,
      },
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.vehicleMaxDamageSections = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  if (setSearch?.province && setSearch.province.length > 0) {
    const response = await getProvinces({
      set: {
        names: setSearch.province,
        page: 1,
        limit: setSearch.province.length || 10,
      } as any,
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.province = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  if (setSearch?.city && setSearch.city.length > 0) {
    const response = await getCities({
      set: {
        names: setSearch.city,
        page: 1,
        limit: setSearch.city.length || 10,
      } as any,
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.city = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  if (setSearch?.township && setSearch.township.length > 0) {
    const response = await getTownships({
      set: {
        names: setSearch.township,
        page: 1,
        limit: setSearch.township.length || 10,
      } as any,
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.township = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  if (setSearch?.road && setSearch.road.length > 0) {
    const response = await getRoads({
      set: {
        names: setSearch.road,
        page: 1,
        limit: setSearch.road.length || 10,
      } as any,
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.road = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  if (setSearch?.trafficZone && setSearch.trafficZone.length > 0) {
    const response = await getTrafficZones({
      set: {
        names: setSearch.trafficZone,
        page: 1,
        limit: setSearch.trafficZone.length || 10,
      } as any,
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.trafficZone = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  if (setSearch?.cityZone && setSearch.cityZone.length > 0) {
    const response = await getCityZones({
      set: {
        names: setSearch.cityZone,
        page: 1,
        limit: setSearch.cityZone.length || 10,
      } as any,
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.cityZone = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  if (setSearch?.accidentType && setSearch.accidentType.length > 0) {
    const response = await getTypes({
      set: {
        names: setSearch.accidentType,
        page: 1,
        limit: setSearch.accidentType.length || 10,
      } as any,
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.accidentType = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  if (setSearch?.position && setSearch.position.length > 0) {
    const response = await getPositions({
      set: {
        names: setSearch.position,
        page: 1,
        limit: setSearch.position.length || 10,
      } as any,
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.position = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  if (setSearch?.rulingType && setSearch.rulingType.length > 0) {
    const response = await getRulingTypes({
      set: {
        names: setSearch.rulingType,
        page: 1,
        limit: setSearch.rulingType.length || 10,
      } as any,
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.rulingType = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  if (setSearch?.lightStatus && setSearch.lightStatus.length > 0) {
    const response = await getLightStatuses({
      set: {
        names: setSearch.lightStatus,
        page: 1,
        limit: setSearch.lightStatus.length || 10,
      } as any,
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.lightStatus = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  if (setSearch?.collisionType && setSearch.collisionType.length > 0) {
    const response = await getCollisionTypes({
      set: {
        names: setSearch.collisionType,
        page: 1,
        limit: setSearch.collisionType.length || 10,
      } as any,
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.collisionType = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  if (setSearch?.roadSituation && setSearch.roadSituation.length > 0) {
    const response = await getRoadSituations({
      set: {
        names: setSearch.roadSituation,
        page: 1,
        limit: setSearch.roadSituation.length || 10,
      } as any,
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.roadSituation = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  if (setSearch?.roadRepairType && setSearch.roadRepairType.length > 0) {
    const response = await getRoadRepairTypes({
      set: {
        names: setSearch.roadRepairType,
        page: 1,
        limit: setSearch.roadRepairType.length || 10,
      } as any,
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.roadRepairType = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  if (setSearch?.shoulderStatus && setSearch.shoulderStatus.length > 0) {
    const response = await getShoulderStatuses({
      set: {
        names: setSearch.shoulderStatus,
        page: 1,
        limit: setSearch.shoulderStatus.length || 10,
      } as any,
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.shoulderStatus = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  if (setSearch?.vehicleColor && setSearch.vehicleColor.length > 0) {
    const response = await getColors({
      set: {
        names: setSearch.vehicleColor,
        page: 1,
        limit: setSearch.vehicleColor.length || 10,
      } as any,
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.vehicleColor = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  if (setSearch?.vehicleSystem && setSearch.vehicleSystem.length > 0) {
    const response = await getSystems({
      set: {
        names: setSearch.vehicleSystem,
        page: 1,
        limit: setSearch.vehicleSystem.length || 10,
      } as any,
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.vehicleSystem = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  if (setSearch?.vehiclePlaqueType && setSearch.vehiclePlaqueType.length > 0) {
    const response = await getPlaqueTypes({
      set: {
        names: setSearch.vehiclePlaqueType,
        page: 1,
        limit: setSearch.vehiclePlaqueType.length || 10,
      } as any,
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.vehiclePlaqueType = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  if (setSearch?.vehicleSystemType && setSearch.vehicleSystemType.length > 0) {
    const response = await getSystemTypes({
      set: {
        names: setSearch.vehicleSystemType,
        page: 1,
        limit: setSearch.vehicleSystemType.length || 10,
      } as any,
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.vehicleSystemType = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  if (
    setSearch?.vehicleFaultStatus &&
    setSearch.vehicleFaultStatus.length > 0
  ) {
    const response = await getFaultStatuses({
      set: {
        names: setSearch.vehicleFaultStatus,
        page: 1,
        limit: setSearch.vehicleFaultStatus.length || 10,
      } as any,
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.vehicleFaultStatus = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  if (
    setSearch?.vehicleInsuranceCo &&
    setSearch.vehicleInsuranceCo.length > 0
  ) {
    const response = await getInsuranceCos({
      set: {
        names: setSearch.vehicleInsuranceCo,
        page: 1,
        limit: setSearch.vehicleInsuranceCo.length || 10,
      } as any,
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.vehicleInsuranceCo = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  if (
    setSearch?.vehiclePlaqueUsage &&
    setSearch.vehiclePlaqueUsage.length > 0
  ) {
    const response = await getPlaqueUsages({
      set: {
        names: setSearch.vehiclePlaqueUsage,
        page: 1,
        limit: setSearch.vehiclePlaqueUsage.length || 10,
      } as any,
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.vehiclePlaqueUsage = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  if (
    setSearch?.vehicleBodyInsuranceCo &&
    setSearch.vehicleBodyInsuranceCo.length > 0
  ) {
    const response = await getBodyInsuranceCos({
      set: {
        names: setSearch.vehicleBodyInsuranceCo,
        page: 1,
        limit: setSearch.vehicleBodyInsuranceCo.length || 10,
      } as any,
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.vehicleBodyInsuranceCo = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  if (
    setSearch?.vehicleMotionDirection &&
    setSearch.vehicleMotionDirection.length > 0
  ) {
    const response = await getMotionDirections({
      set: {
        names: setSearch.vehicleMotionDirection,
        page: 1,
        limit: setSearch.vehicleMotionDirection.length || 10,
      } as any,
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.vehicleMotionDirection = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  if (setSearch?.driverLicenceType && setSearch.driverLicenceType.length > 0) {
    const response = await getLicenceTypes({
      set: {
        names: setSearch.driverLicenceType,
        page: 1,
        limit: setSearch.driverLicenceType.length || 10,
      } as any,
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.driverLicenceType = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  if (
    setSearch?.passengerFaultStatus &&
    setSearch.passengerFaultStatus.length > 0
  ) {
    const response = await getFaultStatuses({
      set: {
        names: setSearch.passengerFaultStatus,
        page: 1,
        limit: setSearch.passengerFaultStatus.length || 10,
      } as any,
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.passengerFaultStatus = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  if (
    setSearch?.pedestrianFaultStatus &&
    setSearch.pedestrianFaultStatus.length > 0
  ) {
    const response = await getFaultStatuses({
      set: {
        names: setSearch.pedestrianFaultStatus,
        page: 1,
        limit: setSearch.pedestrianFaultStatus.length || 10,
      } as any,
      get: { _id: 1, name: 1 },
    });
    if (response && Array.isArray(response)) {
      defaultSearchArrayValues.pedestrianFaultStatus = response.map(
        ({ _id, name }: { _id: string; name: string }) => ({
          value: _id,
          label: name,
        }),
      );
    }
  }

  return {
    setSearch, // The processed search parameters
    accidents, // The list of fetched accidents
    defaultSearchArrayValues, // Values for pre-populating select inputs
  };
};
