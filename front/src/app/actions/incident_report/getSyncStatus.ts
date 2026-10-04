"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["incident_report"]["getSyncStatus"];

/** Sync-state buckets for the officer's non-accident reports. */
export async function getIncidentSyncStatus(request: {
  set?: Partial<Act["set"]>;
}) {
  const token = (await cookies()).get("token");
  return AppApi().send(
    {
      service: "main",
      model: "incident_report",
      act: "getSyncStatus",
      details: {
        set: request.set ?? {},
        get: { _id: 1, report_id: 1 } as never,
      },
    },
    { token: token?.value },
  );
}
