import { buildQuestionTarget, type QuestionTargetSpec } from "@/components/org/process/process-types";
import type { BuilderQuestion, BuilderStep, ProcessDraft } from "@/components/org/process/process-types";

export interface StoredQuestion {
  key: string;
  question: string;
  description?: string;
  required: boolean;
  model_name: string;
  allowed_answer_ids: string[];
  multi_select: boolean;
  order: number;
  target: QuestionTargetSpec;
  icon?: string;
  color?: string;
}

export interface StoredStep {
  key: string;
  title: string;
  description?: string;
  required: boolean;
  questions: StoredQuestion[];
  order: number;
  icon?: string;
  color?: string;
}

export interface StoredProcess {
  name: string;
  description?: string;
  incident_type?: ProcessDraft["incident_type"];
  steps: StoredStep[];
}

/** تبدیل پیش‌نویسِ ویرایشگر به payload سمت سرور با ترتیب ۱..N. */
export const draftToPayload = (draft: ProcessDraft): StoredProcess => {
  const steps = draft.steps.map((step: BuilderStep, i: number) => ({
    key: step.key,
    title: step.title.trim(),
    ...(step.description?.trim() ? { description: step.description.trim() } : {}),
    required: step.required,
    order: i + 1,
    questions: step.questions.map((question: BuilderQuestion, j: number) => ({
      key: question.key,
      question: question.question.trim(),
      ...(question.description?.trim() ? { description: question.description.trim() } : {}),
      required: question.required,
      model_name: question.model_name,
      allowed_answer_ids: question.allowed_answer_ids,
      multi_select: question.multi_select,
      order: j + 1,
      target: buildQuestionTarget(question.model_name),
    })),
  }));
  return {
    name: draft.name.trim(),
    ...(draft.description?.trim() ? { description: draft.description.trim() } : {}),
    ...(draft.incident_type ? { incident_type: draft.incident_type } : {}),
    steps,
  };
};

/** تبدیل پاسخ سمت سرور به پیش‌نویس ویرایشگر. */
export const processToDraft = (process: {
  name: string;
  description?: string;
  incident_type?: string;
  steps?: StoredStep[];
}): ProcessDraft => {
  return {
    name: process.name,
    description: process.description,
    incident_type: (process.incident_type as ProcessDraft["incident_type"]) || undefined,
    steps: (process.steps || []).map((step) => ({
      key: step.key,
      title: step.title,
      description: step.description,
      required: step.required,
      questions: (step.questions || []).map((q) => ({
        key: q.key,
        question: q.question,
        description: q.description,
        required: q.required,
        model_name: q.model_name,
        multi_select: q.multi_select,
        allowed_answer_ids: q.allowed_answer_ids || [],
      })),
    })),
  };
};
