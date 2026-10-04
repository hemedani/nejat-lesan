"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["form_definition"]["getForPatrol"];

export interface PatrolFormOption {
  _id: string;
  name: string;
}

export interface PatrolFormPayload {
  form: {
    _id: string;
    name: string;
    description?: string;
    /** Which model's answers this form's questions write into. */
    form_kind?: "accident" | "incident_report";
    icon?: string;
    schema_version: number;
    definition: unknown;
  } | null;
  options: Record<string, PatrolFormOption[]>;
  version: { version: number };
}

export async function getPatrolForm(request: {
  set?: Partial<Act["set"]>;
}): Promise<{ success: boolean; body?: PatrolFormPayload; message?: string }> {
  // `set.formKind` selects the kind; there is no incident-type filter any more.
  const token = (await cookies()).get("token");
  const response = await AppApi().send(
    {
      service: "main",
      model: "form_definition",
      act: "getForPatrol",
      details: {
        set: { ...request.set },
        get: { form: 1, options: 1, version: 1 } as never,
      },
    },
    { token: token?.value },
  );
  return response as { success: boolean; body?: PatrolFormPayload; message?: string };
}
