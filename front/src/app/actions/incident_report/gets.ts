"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["incident_report"]["gets"];

/**
 * List non-accident reports — road damage, obstructions, other events.
 *
 * Scoped by the backend to what the caller may see, exactly as `accident.gets` is.
 */
export async function getIncidentReports(request: {
  set: Partial<Act["set"]>;
  get?: Partial<Act["get"]>;
}) {
  const token = (await cookies()).get(AUTH_COOKIE);
  return AppApi().send(
    {
      service: "main",
      model: "incident_report",
      act: "gets",
      details: {
        set: { page: 1, limit: 200, ...request.set },
        get: (request.get ?? {}) as never,
      },
    },
    { token: token?.value },
  );
}
