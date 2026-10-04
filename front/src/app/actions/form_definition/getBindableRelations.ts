"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";

export interface BindableRelation {
  /** Relation name as written in a binding's `path`, e.g. `road_defects`. */
  path: string;
  /** The model it points at, e.g. `road_defect`. */
  schemaName: string;
  /** True for a multiple relation, whose bound key ends in `Ids`. */
  multi: boolean;
  required: boolean;
}

/**
 * The relations a form question may bind to, read from the target model itself.
 *
 * The builder must not keep its own list: a hand-written list silently drifts from
 * what the backend accepts, which is how a binding can end up authored that is
 * dropped at submit time.
 */
export async function getBindableRelations(request: {
  set: { formKind: "accident" | "incident_report" };
}) {
  const token = (await cookies()).get("token");
  const response = await AppApi().send(
    {
      service: "main",
      model: "form_definition",
      act: "getBindableRelations",
      details: {
        set: request.set,
        get: { formKind: 1, relations: 1 },
      },
    },
    { token: token?.value },
  );
  const value = response as {
    success?: boolean;
    body?: { relations?: BindableRelation[] };
  };
  return {
    success: value?.success ?? false,
    relations: value?.body?.relations ?? [],
  };
}
