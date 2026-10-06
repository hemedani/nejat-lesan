"use client";

import type { ReportDetailDoc, ReportSource } from "@/types/report-detail";
import { ReviewActions } from "@/components/patrol/ReviewActions";
import { ResubmitAction } from "@/components/patrol/ResubmitAction";
import { ExpandableReportMap } from "@/components/report/ExpandableReportMap";
import { ReportSummaryCard } from "@/components/report/ReportSummaryCard";
import { VehicleSection } from "@/components/report/VehicleSection";
import { PeopleSection } from "@/components/report/PeopleSection";
import { FacilityDamageSection } from "@/components/report/FacilityDamageSection";
import { FormAnswersSection } from "@/components/report/FormAnswersSection";
import { AttachmentGallery } from "@/components/report/AttachmentGallery";
import { ReviewTimeline } from "@/components/report/ReviewTimeline";
import { Field } from "@/components/report/kit";
import { reviewStatusMeta, syncStatusMeta } from "@/utils/patrol-status";
import { formatJalaliDateTime } from "@/utils/formatters";

/**
 * One report, rendered in full.
 *
 * ## Composition, not normalisation
 *
 * The console merges `accident` and `incident_report` into one table, so this page
 * renders both. The two models do **not** share a field list —
 * `incident_report` has no `attachments`, no `vehicle_dtos`, no `people_dtos`, no
 * `facility_damage_dtos` and no casualty counts — so an adapter that normalised
 * one into the other would either invent fields the collection does not hold or
 * drop the ones it does. Instead each section declares the sources it applies to
 * and the absent half is simply never reached. A non-accident report therefore
 * shows an answer list where an accident shows vehicles, and neither renders a
 * block of zeroes that would read as "nothing happened".
 *
 * ## Layout — a sticky rail beside scrolling content
 *
 * RTL, so the rail sits on the **right**: the summary, the review actions and the
 * map stay in view while the body scrolls. That is the whole reason for the shape.
 * A single scrolling column pushes the map and the approve/return buttons off the
 * top of the screen exactly when a reviewer has scrolled down to the vehicle
 * cards to decide whether to approve — which is the decision those buttons serve.
 * Below `lg` the rail becomes the first block in flow and stops being sticky,
 * because a 250px rail and a readable content column cannot share a phone.
 *
 * ## One request
 *
 * `report` arrives complete, including the embedded `review_history`. There is no
 * second fetch for the trail and therefore nothing here that can fail on its own.
 */
export function ReportDetail({
  report,
  source,
  organizationId,
  manager,
  onRefresh,
}: {
  report: ReportDetailDoc;
  source: ReportSource;
  /** Scopes the form-definition read for answer labels. Omitted off the org panels. */
  organizationId?: string;
  /** Org heads and unit heads review exactly like managers do. */
  manager?: boolean;
  onRefresh: () => Promise<void> | void;
}) {
  const isAccident = source === "accident";

  return (
    <div>
      <Header report={report} isAccident={isAccident} />

      <div className="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-[16rem_1fr]">
        <div className="space-y-3 lg:sticky lg:top-4">
          <ReportSummaryCard report={report} source={source} />

          <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-4">
            <h2 className="mb-3 text-sm font-semibold text-white">
              {manager ? "اقدامات بررسی" : "اقدام مأمور"}
            </h2>
            {manager ? (
              <ReviewActions
                report={report}
                source={source}
                onComplete={onRefresh}
              />
            ) : (
              <ResubmitAction report={report} onComplete={onRefresh} />
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-4">
            <h2 className="mb-3 text-sm font-semibold text-white">موقعیت</h2>
            <ExpandableReportMap
              location={report.location}
              gps={report.gps_coords}
              gpsAccuracy={report.gps_accuracy}
            />
          </section>
        </div>

        <div className="space-y-3">
          {isAccident ? (
            <>
              <AccidentContext report={report} />
              <VehicleSection vehicles={report.vehicle_dtos} />
              <PeopleSection
                people={report.people_dtos}
                pedestrians={report.pedestrian_dtos}
              />
              <FacilityDamageSection damages={report.facility_damage_dtos} />
              <AttachmentGallery attachments={report.attachments} />
            </>
          ) : (
            <>
              <ReportContext report={report} />
              <FormAnswersSection
                report={report}
                organizationId={organizationId}
              />
            </>
          )}

          {report.dynamic_answers && report.dynamic_answers.length > 0 && (
            <DynamicAnswers answers={report.dynamic_answers} />
          )}

          <ReviewTimeline history={report.review_history} />
        </div>
      </div>
    </div>
  );
}

function Header({
  report,
  isAccident,
}: {
  report: ReportDetailDoc;
  isAccident: boolean;
}) {
  return (
    <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <p className="text-xs text-blue-300">
          گزارش گشت · {isAccident ? "تصادف" : report.form_title || "رخداد"}
        </p>
        <h1 className="mt-1 text-xl font-bold text-white">
          {report.report_id || `#${report.serial ?? report._id.slice(-6)}`}
        </h1>
        <p className="mt-1.5 text-xs text-slate-500">
          {[
            officerName(report),
            report.patrol_unit?.name || report.patrol_unit?.code,
            when(report.reported_at ?? report.occurred_at),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <StatusLine report={report} />
    </header>
  );
}

function StatusLine({ report }: { report: ReportDetailDoc }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {report.review_status && (
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[10px] ${reviewStatusMeta[report.review_status].className}`}
        >
          {reviewStatusMeta[report.review_status].label}
        </span>
      )}
      {report.sync_status && (
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[10px] ${syncStatusMeta[report.sync_status].className}`}
        >
          {syncStatusMeta[report.sync_status].label}
        </span>
      )}
      {report.submitted_from?.app_version && (
        <span
          className="rounded-full border border-white/10 bg-white/[.04] px-2.5 py-0.5 text-[10px] text-slate-400"
          dir="ltr"
        >
          {report.submitted_from.app_version}
        </span>
      )}
    </div>
  );
}

/** The accident-only blocks: police attendance and the officer's own account. */
function AccidentContext({ report }: { report: ReportDetailDoc }) {
  const hasPolice =
    report.police_present !== undefined ||
    report.police_expert_name ||
    report.police_arrival_time;

  if (!hasPolice && !report.officer_cause_description) return null;

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-4">
      <h2 className="mb-3 text-sm font-semibold text-white">شرح و حضور پلیس</h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Field label="حضور پلیس" value={yesNo(report.police_present)} />
        <Field label="کارشناس پلیس" value={report.police_expert_name} />
        <Field label="زمان حضور" value={when(report.police_arrival_time)} />
      </div>
      {report.officer_cause_description && (
        <p className="mt-2.5 rounded-xl bg-white/[.03] p-3 text-sm leading-7 text-slate-200">
          {report.officer_cause_description}
        </p>
      )}
    </section>
  );
}

/** The blocks both models share. */
function ReportContext({ report }: { report: ReportDetailDoc }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-4">
      <h2 className="mb-3 text-sm font-semibold text-white">زمینه گزارش</h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Field label="واحد گشت" value={report.patrol_unit?.name ?? report.patrol_unit?.code} />
        <Field label="خودرو" value={report.vehicle?.plaque_no} ltr />
        <Field label="جهت حرکت" value={report.travel_direction} />
        <Field label="استان / شهر" value={[report.province?.name, report.city?.name].filter(Boolean).join("، ")} />
        <Field label="ایستگاه پلیس" value={report.police_station?.name} />
        <Field label="سازمان" value={report.organization?.name} />
      </div>
    </section>
  );
}

/**
 * `accident.dynamic_answers`, shown raw.
 *
 * These `question_key`s come from `accident_process` — a different model with its
 * own versioning lifecycle — not from `form_definition`, so the labels resolved
 * for a non-accident report are not available here. The key is still a readable
 * path (`vehicles[1].plate`), and the answer beside it is already resolved text,
 * so the section is honest rather than blank. Labelling it wrongly, by reusing
 * the form definition's keys, would be worse than showing the key.
 */
function DynamicAnswers({
  answers,
}: {
  answers: NonNullable<ReportDetailDoc["dynamic_answers"]>;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-4">
      <h2 className="mb-3 text-sm font-semibold text-white">یادداشت‌های تکمیلی</h2>
      <dl className="divide-y divide-white/5">
        {answers.map((answer, index) => (
          <div key={`${answer.question_key}-${index}`} className="flex flex-wrap gap-x-3 gap-y-1 py-2">
            <dt className="min-w-[9rem] text-xs text-slate-500" dir="ltr">
              {answer.question_key}
            </dt>
            <dd className="flex-1 text-xs leading-6 text-slate-200">
              {answer.answer_names?.join("، ") ??
                answer.answer_name ??
                answer.value ??
                "—"}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}


const officerName = (report: ReportDetailDoc): string | undefined =>
  [report.officer?.first_name, report.officer?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim() || undefined;

const when = (value?: string): string | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : formatJalaliDateTime(date);
};

const yesNo = (value?: boolean): string | undefined =>
  value === undefined || value === null ? undefined : value ? "بله" : "خیر";