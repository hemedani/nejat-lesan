export interface BuilderQuestion {
  key: string;
  question: string;
  description?: string;
  required: boolean;
  model_name: string;
  multi_select: boolean;
  allowed_answer_ids: string[];
}

export interface BuilderStep {
  key: string;
  title: string;
  description?: string;
  required: boolean;
  questions: BuilderQuestion[];
}

export interface ProcessDraft {
  name: string;
  description?: string;
  incident_type?: "accident" | "road_breakdown" | "road_obstacle" | "other";
  steps: BuilderStep[];
}

export const INCIDENT_TYPES: Array<{ value: ProcessDraft["incident_type"]; label: string }> = [
  { value: "accident", label: "تصادف" },
  { value: "road_breakdown", label: "خرابی راه" },
  { value: "road_obstacle", label: "مانع جاده" },
  { value: "other", label: "سایر رخدادها" },
];

export const newKey = (): string =>
  (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).slice(0, 8);

export type QuestionTargetSpec =
  | { kind: "relation"; path: string }
  | { kind: "dto"; dto: string; field: string }
  | { kind: "dynamic" };

/** نگاشت مدل پاسخ → target_spec (هم‌راستا با رجیستری سمت سرور). */
export const QUESTION_TARGETS: Record<string, QuestionTargetSpec> = {
  collision_type: { kind: "relation", path: "collision_type" },
  damage_severity: { kind: "relation", path: "incident_severity" },
  incident_severity: { kind: "relation", path: "incident_severity" },
  road_defect: { kind: "relation", path: "road_defects" },
  equipment_damage: { kind: "relation", path: "equipment_damages" },
  vehicle_type: { kind: "dto", dto: "vehicle_dtos", field: "vehicle_type" },
  light_status: { kind: "relation", path: "light_status" },
  road_surface_condition: { kind: "relation", path: "road_surface_conditions" },
  air_status: { kind: "relation", path: "air_statuses" },
  position: { kind: "relation", path: "lane" },
};

export const buildQuestionTarget = (modelName: string): QuestionTargetSpec =>
  QUESTION_TARGETS[modelName] ?? { kind: "dynamic" };
