"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

/**
 * The review trail of one non-accident report, newest action first.
 *
 * The `incident_report` twin of `accident.getReportReviewHistory`. The audit rows are
 * the same shape on both models, so the detail view reads either one the same way.
 */
export async function getIncidentReportReviewHistory(
  request: ReqType["main"]["incident_report"]["reviewHistory"],
) {
  const token = (await cookies()).get("token");
  return AppApi().send(
    {
      service: "main",
      model: "incident_report",
      act: "reviewHistory",
      details: request,
    },
    { token: token?.value },
  );
}