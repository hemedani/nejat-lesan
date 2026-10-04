import type { ReqType } from "@/types/declarations/selectInp";

/**
 * Every form-definition read asks for the same shape.
 *
 * Named and merged into each caller's `get` rather than sent bare: an empty `get`
 * on an aggregation act makes Mongo reject the whole query (front/AGENTS.md,
 * "never send an empty `get: {}`").
 */
export const FORM_DEFINITION_PROJECTION = {
  _id: 1,
  name: 1,
  description: 1,
  status: 1,
  version: 1,
  form_kind: 1,
  icon: 1,
  schema_version: 1,
  definition: 1,
  createdAt: 1,
  updatedAt: 1,
  organization: { _id: 1, name: 1 },
} as const;

export type FormDefinitionAct<
  Act extends keyof ReqType["main"]["form_definition"],
> = ReqType["main"]["form_definition"][Act];
