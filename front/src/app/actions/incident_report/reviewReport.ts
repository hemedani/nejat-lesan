"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import { reviewProjection } from "@/services/patrol-projections";
import type { ReqType } from "@/types/declarations/selectInp";

type Request = ReqType["main"]["incident_report"]["reviewReport"];

/**
 * Managerial review of a single non-accident report.
 *
 * The `incident_report` twin of `accident.reviewReport`. Both acts run the same shared
 * state machine server-side; they differ only in which collection the id is resolved
 * against, so a detail screen that knows the row's kind can offer the same actions on
 * either without the buttons silently acting on the wrong collection.
 */
export async function reviewIncidentReport(request: Request) {
  const token = (await cookies()).get("token");
  return AppApi().send({
    service: "main",
    model: "incident_report",
    act: "reviewReport",
    details: {
      set: request.set,
      get: { ...reviewProjection, ...request.get } as never,
    },
  }, { token: token?.value });
}