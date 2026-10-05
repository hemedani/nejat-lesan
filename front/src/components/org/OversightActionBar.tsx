"use client";

import { useCallback, useState } from "react";

import { fetchOversightList } from "@/app/actions/incident_report/getOversightList";
import { bulkReviewReports } from "@/app/actions/incident_report/reviewReports";
import { reportsToCsv } from "@/services/reports-csv";
import {
  ACCIDENT_GROUP_TITLE,
  type OversightFilters,
  type ReviewOutcome,
} from "@/services/report-sources";
import { getPatrolErrorMessage } from "@/utils/api-response";
import { reviewActionLabels, reviewStatusMeta, syncStatusMeta } from "@/utils/patrol-status";
import { Button } from "@/components/atoms/Button";
import MyInput from "@/components/atoms/MyInput";
import { PLATFORM_LABELS } from "@/components/org/OversightTable";
import { DarkModal } from "@/components/patrol/DarkModal";
import { Notice } from "@/components/patrol/ui";

/**
 * The three review actions this bar offers, in the order the state machine walks them.
 *
 * `start_review` is here because it is the only way *into* review from this console:
 * the state machine allows `approve` and `return` from `under_review` and
 * `start_review` from `submitted`, so a selection of freshly submitted reports could
 * not be approved or returned at all — every row would be refused with «تغییر وضعیت
 * گزارش از submitted امکان‌پذیر نیست». A non-accident report had no other caller
 * anywhere in the app, so for that model the queue could not be reviewed from the web
 * whatsoever.
 *
 * It does not widen what an action may do: `start_review` moves a row to
 * `under_review` and nothing else, so the reviewer still approves or returns it
 * deliberately, one click later.
 */
type BulkAction = "start_review" | "approve" | "return";

/**
 * What each action did, in the past tense, for the batch summary.
 *
 * Two forms, because a batch that moved nothing needs the *negated* verb: «هیچیک از
 * ۳ گزارش تأیید شد» says the opposite of what happened. The negative is written out
 * rather than derived by a rule, because Persian negation is not a prefix — «تأیید
 * نشد», «وارد بررسی نشد», «برگشت نخورد».
 */
const ACTION_VERBS: Record<BulkAction, { done: string; notDone: string }> = {
  start_review: { done: "وارد بررسی شد", notDone: "وارد بررسی نشد" },
  approve: { done: "تأیید شد", notDone: "تأیید نشد" },
  return: { done: "برای اصلاح برگشت خورد", notDone: "برای اصلاح برگشت نخورد" },
};

/**
 * Rows one export asks for.
 *
 * `getOversightList` clamps `limit` to 200 server-side, so this is the ceiling, not
 * a choice: a filter matching tens of thousands of reports would need hundreds of
 * paged requests to export whole, and a multi-megabyte CSV assembled in the browser
 * is not a better artifact than a bounded one that says on its face what it left out.
 */
const EXPORT_LIMIT = 200;

/** Refusals listed before the summary collapses into a count. */
const MAX_LISTED_REFUSALS = 8;

/** Rows named in a confirmation before it collapses into a count. */
const MAX_LISTED_TARGETS = 8;

const count = (value: number): string => value.toLocaleString("fa-IR");

/**
 * The selection, named, for the confirmation copy.
 *
 * Same rule as `headline`: «همهٔ ۱ گزارش» is not Persian, because there is no "all
 * of one", so a single row is named rather than counted.
 */
const selectionLabel = (n: number): string =>
  n === 1 ? "گزارش انتخاب‌شده" : `همهٔ ${count(n)} گزارش انتخاب‌شده`;

/**
 * The console's words for the export's enum columns.
 *
 * Only the four columns whose values come from an enum — `source`, `sync_status`,
 * `review_status`, `platform` — because `reportsToCsv` applies this map by value, and
 * a shared map over free-text columns would rewrite a `description` that happened to
 * read like a status word. The four key spaces are disjoint, so merging them is safe.
 */
const CSV_LABELS: Record<string, string> = {
  accident: ACCIDENT_GROUP_TITLE,
  incident_report: "گزارش رخداد",
  ios: PLATFORM_LABELS.ios,
  android: PLATFORM_LABELS.android,
  ...Object.fromEntries(
    Object.entries(syncStatusMeta).map(([value, meta]) => [value, meta.label]),
  ),
  ...Object.fromEntries(
    Object.entries(reviewStatusMeta).map(([value, meta]) => [value, meta.label]),
  ),
};

/** Local day, for the filename. Not `toISOString` — that is UTC and would stamp
 *  yesterday's date on an evening export. */
const localDay = (date: Date): string =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

/** Hand the CSV over as a download, exactly as `downloadFullChartData` does. */
const downloadCsvFile = (csv: string, filename: string): void => {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/** One row the backend refused, named the way the table names it. */
type RefusedRow = { id: string; label: string; error: string };

type BatchSummary = {
  tone: "emerald" | "amber";
  /** Which action this batch ran, so the summary can name it in either tense. */
  action: BulkAction;
  /** How many rows actually transitioned. */
  moved: number;
  /** How many rows the backend answered about at all. */
  answered: number;
  refused: RefusedRow[];
};

/**
 * Read a batch's per-row answers.
 *
 * The act reports per row precisely because a mixed batch is the normal case, so the
 * summary has three honest shapes rather than one: everything moved, some moved, or
 * nothing moved. Only the last two carry the refusals, and neither is dressed as a
 * failure of the batch — the backend answered, and the answer is in the list.
 *
 * An empty `results` is its own shape: `success: true` with no body is a real reply
 * ("every row was skipped"), and it must not be reported as a count of zero moves.
 */
const summarize = (
  results: ReviewOutcome[],
  action: BulkAction,
  labelFor: (id: string) => string,
): BatchSummary => {
  const refused: RefusedRow[] = results
    .filter((row) => !row.ok)
    .map((row) => ({
      id: row.reportId,
      label: labelFor(row.reportId),
      error: row.error ?? "دلیل نامشخص",
    }));
  const moved = results.length - refused.length;

  return {
    action,
    tone: moved > 0 && refused.length === 0 ? "emerald" : "amber",
    moved,
    answered: results.length,
    refused,
  };
};

/**
 * The one sentence that says whether the batch worked, before the refusals.
 *
 * A single report is *named*, not counted. Persian does not pluralise a noun after a
 * numeral — «۳ گزارش» is right — but a pronoun that presumes a plurality is not:
 * «هیچیک از ۱ گزارش» and «همهٔ ۱ گزارش» are both wrong, because there is no "one of
 * many" when there is exactly one, and the batch bar is a one-row batch most of the
 * time a reviewer uses it. The negated verb matters just as much: a batch that moved
 * nothing did not «تأیید شد».
 */
const headline = (summary: BatchSummary): string => {
  if (summary.answered === 0) {
    return "نتیجه‌ای برای این دسته برنگشت؛ هیچ گزارشی تغییر نکرد.";
  }

  const verb = ACTION_VERBS[summary.action];
  const single = summary.answered === 1;

  if (summary.moved === 0) {
    return single
      ? `گزارش انتخاب‌شده ${verb.notDone}. دلیل:`
      : `هیچ‌یک از ${count(summary.answered)} گزارش انتخاب‌شده ${verb.notDone}. دلیل هر مورد:`;
  }
  if (summary.refused.length === 0) {
    return single
      ? `گزارش انتخاب‌شده ${verb.done}.`
      : `همهٔ ${count(summary.moved)} گزارش انتخاب‌شده ${verb.done}.`;
  }
  return (
    `${count(summary.moved)} گزارش از ${count(summary.answered)} گزارش انتخاب‌شده ` +
    `${verb.done}. ${count(summary.refused.length)} گزارش اعمال نشد:`
  );
};

/**
 * The console's action bar: what to do with the ticked rows, and what happened.
 *
 * Driven by the selection the view already holds, which the view drops whenever the
 * presented row set changes — its own filter and page controls, a `Link` push, the
 * browser's back/forward — so a batch is the set of rows the reviewer could
 * currently see, and it is built from ids rather than `rows` only because the act
 * needs ids. That invariant lives in the view, and this bar does not take it on
 * trust: `presentedIds` is re-checked at the point of submission below, so the act's
 * input cannot disagree with the table even if the invariant is ever narrowed again —
 * within one organization nothing else would catch it, since the backend's per-row
 * scope check passes ids the reviewer was already entitled to see. Nothing here
 * branches on `row.source`: accidents and non-accident reports are one table, the act
 * resolves each id to the model it belongs to, and a bar that assumed one type would
 * refuse half its own selection.
 *
 * All three actions confirm, in the same dialog and with the same row list. Approve
 * needs it most: it is the irreversible direction, it takes no reason, so without a
 * confirmation one click transitions whatever happened to be ticked — and a selection
 * outliving a change of the presented rows is exactly the case where "whatever
 * happened to be ticked" is not what the reviewer is looking at. Start review confirms
 * for the other half of the same reason: it is the action that decides which rows of a
 * queue are open, and a selection of forty is rarely all in one state. Return already
 * had to collect a shared reason, so it costs nothing extra to confirm.
 *
 * A mixed selection is reported honestly per row, by the act: rows already in the
 * target state are refused with the state machine's own message naming where they are,
 * the rows that could move do, and only the moved rows are deselected — so a
 * `submitted` + `under_review` selection answered with «شروع بررسی» leaves the
 * already-reviewed rows ticked and says why, which is exactly the set the next approve
 * should act on.
 */
export function OversightActionBar({
  selected,
  presentedIds,
  filter,
  total,
  labelFor,
  onSelectionChange,
  onRefresh,
}: {
  selected: string[];
  /**
   * Ids of the rows on screen. The second line of defence described above; the empty
   * set means "nothing is presented to check against" and is deliberately not read as
   * "nothing is selected" — a page past the end renders this bar with no table under
   * it, and that must not read as an empty submission.
   */
  presentedIds: Set<string>;
  /** The console's filter, as the URL parsed it. The export re-asks for it. */
  filter: OversightFilters;
  /** Rows the current filter matches, from the list act. */
  total: number;
  /** How a report id reads on screen, including ids from pages no longer shown. */
  labelFor: (id: string) => string;
  /** Hand back the ids the reviewer should still have selected. */
  onSelectionChange: (ids: string[]) => void;
  /** Re-read the list and the statistics so the counts show the change. */
  onRefresh: () => Promise<void>;
}) {
  const [pending, setPending] = useState<BulkAction | "export" | null>(null);
  const [startReviewOpen, setStartReviewOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [summary, setSummary] = useState<BatchSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const busy = pending !== null;
  const selectedCount = selected.length;

  /** Close whichever confirmation is open — one dialog at a time, three actions. */
  const closeModals = useCallback(() => {
    setStartReviewOpen(false);
    setApproveOpen(false);
    setReturnOpen(false);
  }, []);

  const runReview = async (action: BulkAction, actionReason?: string) => {
    // Normally the whole array: the view clears the selection on every change of the
    // presented rows, so the intersection is a no-op and this costs nothing. It is
    // checked here anyway because this is the last point where the act's input can be
    // made to agree with the table — and an empty result is reported rather than sent
    // as a silent no-op batch.
    const targets =
      presentedIds.size > 0 ? selected.filter((id) => presentedIds.has(id)) : selected;

    if (targets.length === 0) {
      setSummary(null);
      setError("هیچ‌یک از گزارش‌های انتخاب‌شده در ردیف‌های این صفحه نیست؛ اقدامی انجام نشد.");
      onSelectionChange([]);
      closeModals();
      return;
    }

    setPending(action);
    setError(null);
    setSummary(null);

    try {
      const results = await bulkReviewReports(targets, action, actionReason);
      setSummary(summarize(results, action, labelFor));
      // The rows that moved are deselected; the rows that refused stay ticked, so
      // the next attempt over them is one click rather than a hunt for the same
      // ids. Only when the act actually answered per row — a reply with no results
      // says nothing about what happened to the selection, so it is left alone.
      if (results.length > 0) {
        onSelectionChange(results.filter((row) => !row.ok).map((row) => row.reportId));
      }
      closeModals();
      setReason("");
      await onRefresh();
    } catch (cause) {
      // The whole request was refused — a role that may not review, or a return with
      // no reason — so nothing was applied and the selection stays as it was.
      setError(getPatrolErrorMessage(cause));
      closeModals();
    } finally {
      setPending(null);
    }
  };

  const exportCsv = async () => {
    setPending("export");
    setError(null);

    try {
      // The filter, not the visible page: `page: 1` with the largest page the act
      // allows is what makes the button's label true.
      const { rows } = await fetchOversightList({
        ...filter,
        page: 1,
        limit: EXPORT_LIMIT,
      });
      downloadCsvFile(reportsToCsv(rows, CSV_LABELS), `oversight-${localDay(new Date())}.csv`);
    } catch (cause) {
      setError(`خروجی CSV خوانده نشد: ${getPatrolErrorMessage(cause)}`);
    } finally {
      setPending(null);
    }
  };

  const exportLabel =
    total === 0
      ? "خروجی CSV"
      : total <= EXPORT_LIMIT
        ? `خروجی CSV همهٔ ${count(total)} گزارش`
        : `خروجی CSV ${count(EXPORT_LIMIT)} گزارش نخست از ${count(total)}`;

  return (
    <>
      <section className="sticky top-16 z-20 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/90 p-4 backdrop-blur-xl">
        <div>
          <p className="text-sm font-semibold text-white">
            {selectedCount > 0
              ? `${count(selectedCount)} گزارش انتخاب شده`
              : "گزارشی انتخاب نشده"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            شروع بررسی، تأیید و برگشت روی همهٔ گزارش‌های انتخاب‌شده اعمال می‌شود؛ تصادف‌ها و
            گزارش‌های رخداد با هم.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={selectedCount === 0 || busy}
            loading={pending === "start_review"}
            onClick={() => setStartReviewOpen(true)}
          >
            {reviewActionLabels.start_review}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={selectedCount === 0 || busy}
            loading={pending === "approve"}
            onClick={() => setApproveOpen(true)}
          >
            {reviewActionLabels.approve}
          </Button>
          <Button
            variant="warning"
            size="sm"
            disabled={selectedCount === 0 || busy}
            onClick={() => setReturnOpen(true)}
          >
            {reviewActionLabels.return}
          </Button>
          <Button
            variant="neutral"
            size="sm"
            disabled={total === 0 || busy}
            loading={pending === "export"}
            onClick={() => void exportCsv()}
          >
            {exportLabel}
          </Button>
        </div>
      </section>

      {summary && (
        <div className="mb-4">
          <Notice tone={summary.tone}>
            <p>{headline(summary)}</p>
            {summary.refused.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs leading-5">
                {summary.refused.slice(0, MAX_LISTED_REFUSALS).map((row) => (
                  <li key={row.id}>
                    <span dir="ltr" className="font-medium">
                      {row.label}
                    </span>
                    {" — "}
                    {row.error}
                  </li>
                ))}
                {summary.refused.length > MAX_LISTED_REFUSALS && (
                  <li className="text-xs opacity-80">
                    و {count(summary.refused.length - MAX_LISTED_REFUSALS)} مورد دیگر که همچنان
                    انتخاب شده‌اند.
                  </li>
                )}
              </ul>
            )}
          </Notice>
        </div>
      )}

      {error && (
        <div className="mb-4">
          <Notice tone="rose">{error}</Notice>
        </div>
      )}

      <DarkModal
        isOpen={startReviewOpen}
        title={`شروع بررسی ${count(selectedCount)} گزارش`}
        onClose={() => setStartReviewOpen(false)}
        footer={
          <>
            <Button variant="neutral" onClick={() => setStartReviewOpen(false)}>
              انصراف
            </Button>
            <Button
              variant="secondary"
              loading={pending === "start_review"}
              onClick={() => void runReview("start_review")}
            >
              شروع بررسی {count(selectedCount)} گزارش
            </Button>
          </>
        }
      >
        <p className="mb-3 text-xs leading-6 text-slate-400">
          گزارش‌های زیر به وضعیت «در حال بررسی» می‌روند تا بتوانید آن‌ها را تأیید یا برای اصلاح
          برگردانید؛ تصادف‌ها و گزارش‌های رخداد با هم. گزارشی که همین حالا در حال بررسی است
          اعمال نمی‌شود و دلیلش پس از اجرا فهرست می‌شود.
        </p>
        <SelectedReportList selected={selected} labelFor={labelFor} />
      </DarkModal>

      <DarkModal
        isOpen={approveOpen}
        title={`تأیید ${count(selectedCount)} گزارش`}
        onClose={() => setApproveOpen(false)}
        footer={
          <>
            <Button variant="neutral" onClick={() => setApproveOpen(false)}>
              انصراف
            </Button>
            <Button
              variant="secondary"
              loading={pending === "approve"}
              onClick={() => void runReview("approve")}
            >
              تأیید {count(selectedCount)} گزارش
            </Button>
          </>
        }
      >
        <p className="mb-3 text-xs leading-6 text-slate-400">
          گزارش‌های زیر به وضعیت «تأییدشده» می‌روند و از صف بررسی خارج می‌شوند؛ تصادف‌ها و
          گزارش‌های رخداد با هم. تنها گزارش‌هایی که همین حالا «در حال بررسی» هستند این
          انتقال را می‌پذیرند.
        </p>
        <SelectedReportList selected={selected} labelFor={labelFor} />
      </DarkModal>

      <DarkModal
        isOpen={returnOpen}
        title={`برگشت ${count(selectedCount)} گزارش برای اصلاح`}
        onClose={() => setReturnOpen(false)}
        footer={
          <>
            <Button variant="neutral" onClick={() => setReturnOpen(false)}>
              انصراف
            </Button>
            <Button
              variant="warning"
              disabled={!reason.trim() || busy}
              loading={pending === "return"}
              onClick={() => void runReview("return", reason.trim())}
            >
              ثبت برگشت
            </Button>
          </>
        }
      >
        <p className="mb-3 text-xs leading-6 text-slate-400">
          این دلیل روی {selectionLabel(selectedCount)} ثبت می‌شود؛ ثبت دلیل برای برگشت
          الزامی است.
        </p>
        <SelectedReportList selected={selected} labelFor={labelFor} />
        <MyInput
          type="textarea"
          name="oversight-return-reason"
          label="دلیل برگشت برای اصلاح"
          placeholder="دلیل اصلاح را برای مأموران گشت شرح دهید..."
          rows={4}
          value={reason}
          onValueChange={setReason}
          errMsg={!reason.trim() ? "ثبت دلیل الزامی است." : undefined}
        />
      </DarkModal>
    </>
  );
}

/**
 * The rows an action is about to touch, named.
 *
 * The count in the button says how many; this says which, which is the part that
 * makes a confirmation a check rather than a formality. Same list, same cap and same
 * `reportLabel` naming as the refusal summary below the bar, because they answer the
 * same question — what this act is acting on — at two different moments.
 */
function SelectedReportList({
  selected,
  labelFor,
}: {
  selected: string[];
  labelFor: (id: string) => string;
}) {
  return (
    <ul className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-white/10 bg-white/[.02] p-3 text-xs leading-5 text-slate-300">
      {selected.slice(0, MAX_LISTED_TARGETS).map((id) => (
        <li key={id}>
          <span dir="ltr" className="font-medium">
            {labelFor(id)}
          </span>
        </li>
      ))}
      {selected.length > MAX_LISTED_TARGETS && (
        <li className="text-slate-500">
          و {count(selected.length - MAX_LISTED_TARGETS)} گزارش دیگر
        </li>
      )}
    </ul>
  );
}
