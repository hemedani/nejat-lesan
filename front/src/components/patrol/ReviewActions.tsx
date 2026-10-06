"use client";

import { useEffect, useState } from "react";
import { reviewReport } from "@/app/actions/accident/reviewReport";
import { reviewIncidentReport } from "@/app/actions/incident_report/reviewReport";
import { getPatrolErrorMessage, unwrapApiResponse } from "@/utils/api-response";
import { availableReviewActions, reviewActionLabels } from "@/utils/patrol-status";
import type { ReviewAction, ReviewStatus } from "@/types/patrol";
import type { ReportSource } from "@/types/report-detail";
import MyInput from "@/components/atoms/MyInput";
import { Button } from "@/components/atoms/Button";
import { Notice } from "@/components/patrol/ui";
import { useScrollLock } from "@/hooks/useScrollLock";

const reviewProjection = {
  _id: 1,
  report_id: 1,
  review_status: 1,
  review_reason: 1,
  reviewed_at: 1,
  completed_at: 1,
  reviewer: { _id: 1, first_name: 1, last_name: 1, personnel_code: 1 },
} as const;

/**
 * Apply one transition to one report, on whichever collection it lives.
 *
 * Both acts run the **same shared state machine** server-side
 * (`incident_report/oversight/reviewTransition.ts`) and differ only in which
 * collection the id is resolved against. Dispatching on `source` is therefore not
 * a nicety: this component used to hardcode `accident.reviewReport`, so approving
 * a row whose `source` was `incident_report` sent an id that is not in
 * `accident`. The act throws in that case, so the failure was loud — but a
 * reviewer could not complete a non-accident review from the detail page at all,
 * while the console's *bulk* bar could, because `bulkReviewReports` resolves the
 * model per row.
 *
 * `source` is required rather than defaulted to `accident`. A default would
 * reintroduce exactly that bug, quietly, for whoever adds the next caller.
 */
export function ReviewActions({
  report,
  source,
  onComplete,
}: {
  /**
   * Only what this component reads.
   *
   * Structural and minimal rather than `PatrolReport` or `ReportDetailDoc`: the
   * actions need an id and a review status, and naming a whole report shape here
   * would make every future change to that shape a compile error in this file.
   */
  report: { _id: string; review_status?: ReviewStatus };
  source: ReportSource;
  onComplete: () => Promise<void> | void;
}) {
  const [pending, setPending] = useState<ReviewAction | null>(null);
  const [returnOpen, setReturnOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const actions = availableReviewActions(report.review_status);

  useScrollLock(returnOpen);

  useEffect(() => {
    if (!returnOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setReturnOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [returnOpen]);

  const run = async (action: ReviewAction, actionReason?: string) => {
    setError(null);
    setPending(action);
    try {
      const set = {
        reportId: report._id,
        action,
        ...(actionReason ? { reason: actionReason } : {}),
      };
      const response =
        source === "incident_report"
          ? await reviewIncidentReport({ set, get: reviewProjection as never })
          : await reviewReport({ set, get: reviewProjection as never });
      unwrapApiResponse(response);
      setReturnOpen(false);
      setReason("");
      await onComplete();
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
      if (actionReason) setReturnOpen(false);
    } finally {
      setPending(null);
    }
  };

  if (!actions.length) {
    return <p className="text-sm text-slate-500">اقدام مدیریتی برای این وضعیت موجود نیست.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) =>
          action === "return" ? (
            <Button
              key={action}
              variant="warning"
              disabled={!!pending}
              onClick={() => setReturnOpen(true)}
            >
              {reviewActionLabels[action]}
            </Button>
          ) : (
            <Button
              key={action}
              disabled={!!pending}
              loading={pending === action}
              onClick={() => void run(action)}
            >
              {pending === action ? "در حال ثبت..." : reviewActionLabels[action]}
            </Button>
          ),
        )}
      </div>

      {returnOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-[calc(100%-2rem)] max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-white">برگشت گزارش برای اصلاح</h3>
            <MyInput
              type="textarea"
              name="return-reason"
              label="دلیل برگشت برای اصلاح"
              placeholder="دلیل اصلاح را برای مأمور گشت شرح دهید..."
              rows={3}
              value={reason}
              onValueChange={setReason}
              errMsg={!reason.trim() ? "ثبت دلیل الزامی است." : undefined}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="neutral" onClick={() => setReturnOpen(false)}>
                انصراف
              </Button>
              <Button
                variant="warning"
                disabled={!reason.trim() || !!pending}
                loading={pending === "return"}
                onClick={() => void run("return", reason.trim())}
              >
                ثبت برگشت
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && <Notice tone="rose">{error}</Notice>}
    </div>
  );
}
