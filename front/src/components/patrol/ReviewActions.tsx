"use client";

import { useEffect, useState } from "react";
import { reviewReport } from "@/app/actions/accident/reviewReport";
import { getPatrolErrorMessage, unwrapApiResponse } from "@/utils/api-response";
import { availableReviewActions, reviewActionLabels } from "@/utils/patrol-status";
import type { PatrolReport, ReviewAction } from "@/types/patrol";
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
  reviewer: { _id: 1, first_name: 1, last_name: 1, personnel_code: 1 },
} as const;

export function ReviewActions({
  report,
  onComplete,
}: {
  report: PatrolReport;
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
      unwrapApiResponse(
        await reviewReport({
          set: {
            reportId: report._id,
            action,
            ...(actionReason ? { reason: actionReason } : {}),
          },
          get: reviewProjection as never,
        }),
      );
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
              variant="dark"
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
