"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["incident_report"]["getManagerReports"];

/** The manager's review queue across non-accident reports. */
export async function getIncidentManagerReports(request: {
  set?: Partial<Act["set"]>;
}) {
  const token = (await cookies()).get("token");
  return AppApi().send(
    {
      service: "main",
      model: "incident_report",
      act: "getManagerReports",
      details: {
        set: { page: 1, limit: 100, ...request.set },
        get: {} as never,
      },
    },
    { token: token?.value },
  );
}
