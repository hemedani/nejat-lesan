"use server";
import { AppApi } from "@/services/api";
import { cookies } from "next/headers";

// Helper function to ensure both _id and name are present
const ensureNameProperty = (
  obj: { _id: string; name?: string } | undefined,
): { _id: string; name: string } | undefined => {
  if (!obj) return undefined;
  return {
    _id: obj._id,
    name: obj.name || "",
  };
};

export const add = async (data: {
  seri: number;
  serial: number;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  date_of_accident: Date;
  completion_date: Date;
  dead_count: number;
  injured_count: number;
  news_number: number;
  officer: string;
  has_witness: boolean;
  provinceId?: string;
  cityId?: string;
  roadId?: string;
  trafficZoneId?: string;
  cityZoneId?: string;
  typeId?: string;
  positionId?: string;
  rulingTypeId?: string;
  lightStatusId?: string;
  collisionTypeId?: string;
  roadSituationId?: string;
  roadRepairTypeId?: string;
  shoulderStatusId?: string;
  areaUsagesIds?: string[];
  airStatusesIds?: string[];
  roadDefectsIds?: string[];
  humanReasonsIds?: string[];
  vehicleReasonsIds?: string[];
  equipmentDamagesIds?: string[];
  roadSurfaceConditionsIds?: string[];
  vehicle_dtos?: {
    color?: {
      _id: string;
      name?: string;
    };
    system?: {
      _id: string;
      name?: string;
    };
    plaque_type?: {
      _id: string;
      name?: string;
    };
    plaque_usage?: {
      _id: string;
      name?: string;
    };
    system_type?: {
      _id: string;
      name?: string;
    };
    fault_status?: {
      _id: string;
      name?: string;
    };
    insurance_co?: {
      _id: string;
      name?: string;
    };
    insurance_no?: string;
    insurance_date?: Date;
    body_insurance_co?: {
      _id: string;
      name?: string;
    };
    body_insurance_no?: string;
    body_insurance_date?: Date;
    motion_direction?: {
      _id: string;
      name?: string;
    };
    print_number?: string;
    insurance_warranty_limit?: number;
    damage_section_other?: string;
    plaque_no?: string[];
    plaque_serial?: string[];
    max_damage_sections?: {
      _id: string;
      name?: string;
    }[];
    driver?: {
      first_name?: string;
      last_name?: string;
      national_code?: string;
      sex?: "Male" | "Female" | "Other";
      licence_type?: {
        _id: string;
        name?: string;
      };
      licence_number?: string;
      injury_type?: {
        _id: string;
        name?: string;
      };
      total_reason?: {
        _id: string;
        name?: string;
      };
    };
    passenger_dtos?: {
      first_name?: string;
      last_name?: string;
      national_code?: string;
      sex?: "Male" | "Female" | "Other";
      injury_type?: {
        _id: string;
        name?: string;
      };
      fault_status?: {
        _id: string;
        name?: string;
      };
      total_reason?: {
        _id: string;
        name?: string;
      };
    }[];
  }[];
  pedestrian_dtos?: {
    first_name?: string;
    last_name?: string;
    national_code?: string;
    sex?: "Male" | "Female" | "Other";
    injury_type?: {
      _id: string;
      name?: string;
    };
    fault_status?: {
      _id: string;
      name?: string;
    };
    total_reason?: {
      _id: string;
      name?: string;
    };
  }[];
}) => {
  const token = (await cookies()).get("token");

  // Process the data to match backend expectations
  const processedData = {
    seri: data.seri,
    serial: data.serial,
    location: data.location,
    date_of_accident: data.date_of_accident,
    completion_date: data.completion_date,
    dead_count: data.dead_count,
    injured_count: data.injured_count,
    news_number: data.news_number,
    officer: data.officer,
    has_witness: data.has_witness,
    // Handle relations with correct field names
    provinceId: data.provinceId || undefined,
    cityId: data.cityId || undefined,
    roadId: data.roadId || undefined,
    trafficZoneId: data.trafficZoneId || undefined,
    cityZoneId: data.cityZoneId || undefined,
    typeId: data.typeId || undefined,
    positionId: data.positionId || undefined,
    rulingTypeId: data.rulingTypeId || undefined,
    lightStatusId: data.lightStatusId || undefined,
    collisionTypeId: data.collisionTypeId || undefined,
    roadSituationId: data.roadSituationId || undefined,
    roadRepairTypeId: data.roadRepairTypeId || undefined,
    shoulderStatusId: data.shoulderStatusId || undefined,
    areaUsagesIds: data.areaUsagesIds || undefined,
    airStatusesIds: data.airStatusesIds || undefined,
    roadDefectsIds: data.roadDefectsIds || undefined,
    humanReasonsIds: data.humanReasonsIds || undefined,
    vehicleReasonsIds: data.vehicleReasonsIds || undefined,
    equipmentDamagesIds: data.equipmentDamagesIds || undefined,
    roadSurfaceConditionsIds: data.roadSurfaceConditionsIds || undefined,
    vehicle_dtos:
      data.vehicle_dtos?.map((vehicle) => ({
        ...vehicle,
        color: ensureNameProperty(vehicle.color),
        system: ensureNameProperty(vehicle.system),
        plaque_type: ensureNameProperty(vehicle.plaque_type),
        plaque_usage: ensureNameProperty(vehicle.plaque_usage),
        system_type: ensureNameProperty(vehicle.system_type),
        fault_status: ensureNameProperty(vehicle.fault_status),
        insurance_co: ensureNameProperty(vehicle.insurance_co),
        body_insurance_co: ensureNameProperty(vehicle.body_insurance_co),
        motion_direction: ensureNameProperty(vehicle.motion_direction),
        plaque_no: vehicle.plaque_no?.length ? vehicle.plaque_no : undefined,
        plaque_serial: vehicle.plaque_serial?.length
          ? vehicle.plaque_serial
          : undefined,
        max_damage_sections: vehicle.max_damage_sections?.length
          ? vehicle.max_damage_sections
          : undefined,
        driver: vehicle.driver
          ? {
              ...vehicle.driver,
              licence_type: ensureNameProperty(vehicle.driver.licence_type),
              injury_type: ensureNameProperty(vehicle.driver.injury_type),
              total_reason: ensureNameProperty(vehicle.driver.total_reason),
            }
          : undefined,
        passenger_dtos: vehicle.passenger_dtos?.map((passenger) => ({
          ...passenger,
          injury_type: ensureNameProperty(passenger.injury_type),
          fault_status: ensureNameProperty(passenger.fault_status),
          total_reason: ensureNameProperty(passenger.total_reason),
        })),
      })) || undefined,
    pedestrian_dtos:
      data.pedestrian_dtos?.map((pedestrian) => ({
        ...pedestrian,
        injury_type: ensureNameProperty(pedestrian.injury_type),
        fault_status: ensureNameProperty(pedestrian.fault_status),
        total_reason: ensureNameProperty(pedestrian.total_reason),
      })) || undefined,
  };

  // Remove undefined values
  const cleanedData = Object.fromEntries(
    Object.entries(processedData).filter(([, value]) => value !== undefined),
  );

  return await AppApi().send(
    {
      service: "main",
      model: "accident",
      act: "add",
      details: {
        set: cleanedData,
        get: {
          _id: 1,
          seri: 1,
          serial: 1,
          location: 1,
          date_of_accident: 1,
          completion_date: 1,
          dead_count: 1,
          injured_count: 1,
          news_number: 1,
          officer: 1,
          has_witness: 1,
          province: {
            _id: 1,
            name: 1,
          },
          city: {
            _id: 1,
            name: 1,
          },
          road: {
            _id: 1,
            name: 1,
          },
          traffic_zone: {
            _id: 1,
            name: 1,
          },
          city_zone: {
            _id: 1,
            name: 1,
          },
          type: {
            _id: 1,
            name: 1,
          },
          area_usages: {
            _id: 1,
            name: 1,
          },
          position: {
            _id: 1,
            name: 1,
          },
          ruling_type: {
            _id: 1,
            name: 1,
          },
          air_statuses: {
            _id: 1,
            name: 1,
          },
          light_status: {
            _id: 1,
            name: 1,
          },
          road_defects: {
            _id: 1,
            name: 1,
          },
          human_reasons: {
            _id: 1,
            name: 1,
          },
          collision_type: {
            _id: 1,
            name: 1,
          },
          road_situation: {
            _id: 1,
            name: 1,
          },
          road_repair_type: {
            _id: 1,
            name: 1,
          },
          shoulder_status: {
            _id: 1,
            name: 1,
          },
          vehicle_reasons: {
            _id: 1,
            name: 1,
          },
          equipment_damages: {
            _id: 1,
            name: 1,
          },
          road_surface_conditions: {
            _id: 1,
            name: 1,
          },
          vehicle_dtos: 1,
          pedestrian_dtos: 1,
        },
      },
    },
    { token: token?.value },
  );
};
