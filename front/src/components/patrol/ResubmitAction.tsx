"use client";

import { useState } from "react";
import { resubmitReport } from "@/app/actions/accident/resubmitReport";
import { getPatrolErrorMessage, unwrapApiResponse } from "@/utils/api-response";
import type { PatrolReport } from "@/types/patrol";
import { Button } from "@/components/atoms/Button";
import { Notice } from "@/components/patrol/ui";

export function ResubmitAction({
  report,
  onComplete,
}: {
  report: PatrolReport;
  onComplete: () => Promise<void> | void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (report.review_status !== "returned" || report.sync_status !== "synced") return null;

  const submit = async () => {
    setPending(true);
    setError(null);
    try {
      unwrapApiResponse(
        await resubmitReport({
          set: { reportId: report._id },
          get: { _id: 1, report_id: 1, review_status: 1, review_reason: 1, reviewed_at: 1 },
        }),
      );
      await onComplete();
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button onClick={submit} loading={pending} disabled={pending}>
        {pending ? "در حال ارسال..." : "ارسال مجدد گزارش"}
      </Button>
      {error && <Notice tone="rose">{error}</Notice>}
    </div>
  );
}
