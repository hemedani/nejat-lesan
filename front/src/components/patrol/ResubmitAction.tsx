"use client";

import { useState } from "react";
import { resubmitReport } from "@/app/actions/accident/resubmitReport";
import { getPatrolErrorMessage, unwrapApiResponse } from "@/utils/api-response";
import type { PatrolReport } from "@/types/patrol";

export function ResubmitAction({ report, onComplete }: { report: PatrolReport; onComplete: () => Promise<void> | void }) {
  const [pending, setPending] = useState(false); const [error, setError] = useState<string | null>(null);
  if (report.review_status !== "returned" || report.sync_status !== "synced") return null;
  const submit = async () => { setPending(true); setError(null); try { unwrapApiResponse(await resubmitReport({ set: { reportId: report._id }, get: { _id: 1, report_id: 1, review_status: 1, review_reason: 1, reviewed_at: 1 } })); await onComplete(); } catch (e) { setError(getPatrolErrorMessage(e)); } finally { setPending(false); } };
  return <div className="space-y-2"><button disabled={pending} onClick={submit} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">{pending ? "در حال ارسال..." : "ارسال مجدد گزارش"}</button>{error && <p className="text-xs text-rose-200">{error}</p>}</div>;
}
