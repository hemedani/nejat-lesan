import { gets as collisionTypeGets } from "@/app/actions/collision_type/gets";
import { gets as roadDefectGets } from "@/app/actions/road_defect/gets";
import { gets as equipmentDamageGets } from "@/app/actions/equipment_damage/gets";
import { gets as lightStatusGets } from "@/app/actions/light_status/gets";
import { gets as roadSurfaceConditionGets } from "@/app/actions/road_surface_condition/gets";
import { gets as airStatusGets } from "@/app/actions/air_status/gets";
import { gets as incidentSeverityGets } from "@/app/actions/incident_severity/gets";
import { gets as positionGets } from "@/app/actions/position/gets";
import { gets as vehicleTypeGets } from "@/app/actions/vehicle_type/gets";

export interface AnswerRow {
  _id: string;
  name: string;
}

type Loader = () => Promise<AnswerRow[]>;

const load = async (
  call: (request: { set: { page: number; limit: number }; get: never }) => Promise<unknown>,
): Promise<AnswerRow[]> => {
  const response = await call({ set: { page: 1, limit: 200 }, get: { _id: 1, name: 1 } as never });
  const body = (response as { success: boolean; body?: unknown })?.body;
  return Array.isArray(body) ? (body as AnswerRow[]) : [];
};

export const QUESTION_MODEL_LABELS: Record<string, string> = {
  collision_type: "نوع برخورد",
  road_defect: "عیب راه",
  equipment_damage: "خسارت تجهیزات",
  light_status: "وضعیت نور",
  road_surface_condition: "شرایط سطح راه",
  air_status: "وضعیت هوا",
  incident_severity: "شدت رخداد",
  damage_severity: "شدت رخداد",
  vehicle_type: "نوع خودرو",
  position: "موقعیت / خط عبور",
};

export const QUESTION_MODEL_LOADERS: Record<string, Loader> = {
  collision_type: () => load(collisionTypeGets as never),
  road_defect: () => load(roadDefectGets as never),
  equipment_damage: () => load(equipmentDamageGets as never),
  light_status: () => load(lightStatusGets as never),
  road_surface_condition: () => load(roadSurfaceConditionGets as never),
  air_status: () => load(airStatusGets as never),
  incident_severity: () => load(incidentSeverityGets as never),
  damage_severity: () => load(incidentSeverityGets as never),
  vehicle_type: () => load(vehicleTypeGets as never),
  position: () => load(positionGets as never),
};

/** تمام مدل‌های موجود در رجیستری سمت سرور (سازگار با QUESTION_MODEL_NAMES). */
export const SUPPORTED_QUESTION_MODELS = Object.keys(QUESTION_MODEL_LOADERS);
