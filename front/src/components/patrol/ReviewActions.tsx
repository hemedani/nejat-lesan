"use client";

import { useState } from "react";
import { reviewReport } from "@/app/actions/accident/reviewReport";
import { getPatrolErrorMessage, unwrapApiResponse } from "@/utils/api-response";
import { availableReviewActions, reviewActionLabels } from "@/utils/patrol-status";
import type { PatrolReport, ReviewAction } from "@/types/patrol";

export function ReviewActions({ report, onComplete }: { report: PatrolReport; onComplete: () => Promise<void> | void }) {
  const [pending, setPending] = useState<ReviewAction | null>(null);
  const [returnOpen, setReturnOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const actions = availableReviewActions(report.review_status);
  const run = async (action: ReviewAction, actionReason?: string) => {
    setError(null); setPending(action);
    try { unwrapApiResponse(await reviewReport({ set: { reportId: report._id, action, ...(actionReason ? { reason: actionReason } : {}) }, get: { _id: 1, report_id: 1, review_status: 1, review_reason: 1, reviewed_at: 1, reviewer: { _id: 1, first_name: 1, last_name: 1, personnel_code: 1 } } })); setReturnOpen(false); setReason(""); await onComplete(); } catch (e) { setError(getPatrolErrorMessage(e)); } finally { setPending(null); }
  };
  if (!actions.length) return <p className="text-sm text-slate-500">اقدام مدیریتی برای این وضعیت موجود نیست.</p>;
  return <div className="space-y-3"><div className="flex flex-wrap gap-2">{actions.map((action) => action === "return" ? <button key={action} disabled={!!pending} onClick={() => setReturnOpen(true)} className="rounded-xl border border-orange-400/30 bg-orange-400/10 px-4 py-2 text-sm text-orange-100 transition hover:bg-orange-400/20">{reviewActionLabels[action]}</button> : <button key={action} disabled={!!pending} onClick={() => run(action)} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50">{pending === action ? "در حال ثبت..." : reviewActionLabels[action]}</button>)}</div>{returnOpen && <div className="rounded-xl border border-orange-400/20 bg-orange-400/5 p-4"><label className="block text-sm text-orange-100" htmlFor="return-reason">دلیل برگشت برای اصلاح</label><textarea id="return-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950/70 p-3 text-sm text-white outline-none focus:border-orange-400/50" />{!reason.trim() && <p className="mt-2 text-xs text-orange-200">ثبت دلیل الزامی است.</p>}<div className="mt-3 flex gap-2"><button disabled={!reason.trim() || !!pending} onClick={() => run("return", reason.trim())} className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">ثبت برگشت</button><button onClick={() => setReturnOpen(false)} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300">انصراف</button></div></div>}{error && <p className="rounded-lg border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-100">{error}</p>}</div>;
}
