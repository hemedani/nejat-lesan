"use server";

import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/utils/auth-constants";
import { AppApi } from "@/services/api";
import type { ReportSource } from "@/types/report-detail";

/**
 * One row to delete, and which collection it lives in.
 *
 * The oversight console merges `accident` and `incident_report` into one table, and
 * each has its own `remove` act, so the caller has to say which — the id alone does
 * not. `ReportSource` is the same discriminator the table and the detail route
 * already carry.
 */
export type RemoveTarget = { reportId: string; source: ReportSource };

/** One row's answer. Shaped like `ReviewOutcome` so the bar reports both the same way. */
export type RemoveOutcome = { reportId: string; ok: boolean; error?: string };

/**
 * Delete reports the reviewer ticked, one act per row.
 *
 * There is no batch act behind this: `accident.remove` and `incident_report.remove`
 * each take a single `_id`, so a selection of twenty-five is twenty-five calls.
 * They run **sequentially** rather than as one `Promise.all` burst because each is a
 * cascade delete — the backend walks the report's relations and removes them — and a
 * simultaneous burst of twenty-five cascades is a worse thing to hand Mongo than a
 * few extra hundred milliseconds of latency in a dialog that is already spinning.
 *
 * Deleting is not all-or-nothing, for the same reason reviewing is not: a mixed
 * selection is normal (some rows are outside the caller's road scope, some are
 * already gone), and a reviewer who ticked twenty reports needs to know which
 * three survived. So the failures come back in `results` and only a transport-level
 * failure throws.
 *
 * Authorization is the backend's, not this function's: both acts are level-gated
 * (`grantAccess` passes `Ghost` through any level list, which is what lets a Ghost
 * delete from this console) and `incident_report.remove` additionally runs inside
 * `getOrgReportBase`, so an id outside the caller's scope is answered «گزارش یافت
 * نشد یا دسترسی ندارید» rather than deleted.
 */
export async function bulkRemoveReports(
  targets: RemoveTarget[],
): Promise<RemoveOutcome[]> {
  if (targets.length === 0) return [];

  const token = (await cookies()).get(AUTH_COOKIE);
  const api = AppApi();

  const results: RemoveOutcome[] = [];

  for (const { reportId, source } of targets) {
    // Two branches rather than one shared body with a computed `model`: `send`'s
    // request type is per-model, and a widened `model` would stop checking the act
    // and its `get` shape.
    const response =
      source === "incident_report"
        ? await api.send(
            {
              service: "main",
              model: "incident_report",
              act: "remove",
              details: {
                set: { _id: reportId, hardCascade: true },
                get: { success: true },
              },
            },
            { token: token?.value },
          )
        : await api.send(
            {
              service: "main",
              model: "accident",
              act: "remove",
              details: {
                set: { _id: reportId, hardCascade: true },
                get: { success: 1 },
              },
            },
            { token: token?.value },
          );

    const envelope = response as { success?: boolean; body?: unknown };
    if (envelope?.success) {
      results.push({ reportId, ok: true });
      continue;
    }

    // `deleteOne` throws «can not find this documents» when the filter matched
    // nothing — which is also what an id outside the caller's scope looks like — so
    // the backend's own text is English here and must not reach the bar. Only a
    // Persian message (`incident_report.remove`'s «گزارش یافت نشد یا دسترسی ندارید»)
    // is passed through; anything else gets the one sentence that is true of both
    // cases.
    const raw = (envelope?.body as { message?: string } | null)?.message;
    results.push({
      reportId,
      ok: false,
      error:
        raw && /[\u0600-\u06FF]/.test(raw)
          ? raw
          : "گزارش حذف نشد؛ احتمالاً پیش‌تر حذف شده یا در محدوده دسترسی شما نیست.",
    });
  }

  return results;
}
