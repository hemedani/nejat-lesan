"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["form_definition"]["validate"];

export interface ValidationIssue {
  path: string;
  nodeKey: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  blockedPages: string[];
  canSubmit: boolean;
  definition_version: number;
  schema_version: number;
}

/**
 * Ask the backend to re-check a draft.
 *
 * The browser has already validated locally with the same engine, so this is a
 * confirmation rather than the primary loop — it exists because a stale or
 * tampered client must not be able to file a form its own definition forbids.
 */
export async function validateFormAnswers(request: {
  set: Act["set"];
}) {
  const token = (await cookies()).get("token");
  const response = await AppApi().send(
    {
      service: "main",
      model: "form_definition",
      act: "validate",
      details: { set: request.set, get: {} as never },
    },
    { token: token?.value },
  );
  return response as {
    success: boolean;
    body?: ValidationResult;
    message?: string;
  };
}
