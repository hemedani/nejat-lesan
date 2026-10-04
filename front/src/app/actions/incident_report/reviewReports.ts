"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import { unwrapApiResponse } from "@/utils/api-response";
import type { ReqType } from "@/types/declarations/selectInp";
import type { ReviewOutcome } from "@/services/report-sources";
import type { ReviewAction } from "@/types/patrol";

type Act = ReqType["main"]["incident_report"]["reviewReports"];

/**
 * Apply one review action to many reports.
 *
 * Per-row outcomes come back rather than a single success flag, because a mixed
 * batch is the normal case — some rows are not synced yet, some are in the wrong
 * state, some belong to another organization — and a reviewer who approves forty
 * reports needs to know which three did not move.
 *
 * The per-row failures are in `results`, not thrown. Only the whole-request
 * guards throw (a role that may not review, a return with no reason), and those
 * mean nothing was applied at all.
 */
export async function bulkReviewReports(
  reportIds: string[],
  action: ReviewAction,
  reason?: string,
): Promise<ReviewOutcome[]> {
  const token = (await cookies()).get("token");

  // Annotated rather than passed inline: `send` infers its `set` type from the
  // argument, and an inferred type parameter accepts any extra key — so a
  // misspelled key would compile and then come back as a validation error from
  // Superstruct. Naming the type makes the object literal checked.
  const set: Act["set"] = { reportIds, action, reason };

  const response = await AppApi().send(
    {
      service: "main",
      model: "incident_report",
      act: "reviewReports",
      details: { set, get: {} },
    },
    { token: token?.value },
  );

  // `| undefined` because `success: true` with no body is a real answer here too —
  // an empty `results` is the honest reading of "every row was skipped", and the
  // caller shows that as its own state rather than as a crash.
  const body = unwrapApiResponse<{ results?: ReviewOutcome[] } | undefined>(
    response,
  );
  return body?.results ?? [];
}