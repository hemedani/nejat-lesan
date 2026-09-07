import {
	air_status,
	collision_type,
	damage_severity,
	equipment_damage,
	incident_severity,
	light_status,
	position,
	road_defect,
	road_surface_condition,
	vehicle_type,
} from "../../mod.ts";

/**
 * D14/D16: نقشه model_name → مدل منبع پاسخ + محل ذخیره روی accident.
 * هر مدل فقط رکوردهای `{ _id, name }` دارد (shared-relation pattern)، بنابراین
 * fetch یکسان است. مدل‌ها به‌صورت lazy (داخل تابع) از mod.ts خوانده می‌شوند تا
 * ریسک TDZ چرخش import (mod.ts ← src ← این فایل) پیش نیاید.
 */
export type QuestionTarget =
	| { kind: "relation"; path: string }
	| { kind: "dto"; dto: string; field: string }
	| { kind: "dynamic" };

export const QUESTION_REGISTRY: Record<
	string,
	{ target: QuestionTarget; multi: boolean }
> = {
	collision_type: {
		target: { kind: "relation", path: "collision_type" },
		multi: false,
	},
	damage_severity: {
		// D1: شدت روی accident در رابطه incident_severity ذخیره می‌شود
		target: { kind: "relation", path: "incident_severity" },
		multi: false,
	},
	incident_severity: {
		target: { kind: "relation", path: "incident_severity" },
		multi: false,
	},
	road_defect: {
		target: { kind: "relation", path: "road_defects" },
		multi: true,
	},
	equipment_damage: {
		target: { kind: "relation", path: "equipment_damages" },
		multi: true,
	},
	vehicle_type: {
		// نگاشت دقیق داخل DTO = follow-up موبایل
		target: { kind: "dto", dto: "vehicle_dtos", field: "vehicle_type" },
		multi: false,
	},
	light_status: {
		target: { kind: "relation", path: "light_status" },
		multi: false,
	},
	road_surface_condition: {
		target: { kind: "relation", path: "road_surface_conditions" },
		multi: true,
	},
	air_status: {
		target: { kind: "relation", path: "air_statuses" },
		multi: true,
	},
	position: {
		target: { kind: "relation", path: "lane" },
		multi: false,
	},
};

export const QUESTION_MODEL_NAMES = Object.keys(QUESTION_REGISTRY);

/** lazy resolve مدل منبع پاسخ (فقط داخل بدنه توابع صدا بزنید). */
export const getRegistryModel = (modelName: string): any => {
	switch (modelName) {
		case "collision_type":
			return collision_type;
		case "damage_severity":
			return damage_severity;
		case "incident_severity":
			return incident_severity;
		case "road_defect":
			return road_defect;
		case "equipment_damage":
			return equipment_damage;
		case "vehicle_type":
			return vehicle_type;
		case "light_status":
			return light_status;
		case "road_surface_condition":
			return road_surface_condition;
		case "air_status":
			return air_status;
		case "position":
			return position;
		default:
			return undefined;
	}
};
