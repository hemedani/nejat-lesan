"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";

export interface ReferenceModelInfo {
  model: string;
  /** False means a question pointing at it would render an empty dropdown. */
  hasRecords: boolean;
}

/**
 * The models a `reference` question may draw options from.
 *
 * Served by the backend rather than kept in the builder, because the two hand-kept
 * lists had already drifted sixteen models apart. `hasRecords` lets the builder
 * warn before the author writes a question that can never be answered — the same
 * condition `activate` refuses on.
 */
export async function getReferenceModels() {
  const token = (await cookies()).get("token");
  const response = await AppApi().send(
    {
      service: "main",
      model: "form_definition",
      act: "getReferenceModels",
      details: { set: {}, get: { models: 1 } },
    },
    { token: token?.value },
  );
  const value = response as {
    success?: boolean;
    body?: { models?: ReferenceModelInfo[] };
  };
  return {
    success: value?.success ?? false,
    models: value?.body?.models ?? [],
  };
}
