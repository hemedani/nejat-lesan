"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["incident_report"]["getReporterDashboard"];

/** The officer's own non-accident reports, with sync/review counts. */
export async function getIncidentReporterDashboard(request: {
  set?: Partial<Act["set"]>;
}) {
  const token = (await cookies()).get(AUTH_COOKIE);
  return AppApi().send(
    {
      service: "main",
      model: "incident_report",
      act: "getReporterDashboard",
      details: {
        set: { page: 1, limit: 50, ...request.set },
        get: {} as never,
      },
    },
    { token: token?.value },
  );
}
