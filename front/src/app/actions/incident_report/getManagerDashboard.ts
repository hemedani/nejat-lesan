"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["incident_report"]["getManagerDashboard"];

/** Organization-wide non-accident reports, for the review console's dashboard. */
export async function getIncidentManagerDashboard(request: {
  set?: Partial<Act["set"]>;
}) {
  const token = (await cookies()).get("token");
  return AppApi().send(
    {
      service: "main",
      model: "incident_report",
      act: "getManagerDashboard",
      details: {
        set: { page: 1, limit: 50, ...request.set },
        get: {} as never,
      },
    },
    { token: token?.value },
  );
}
