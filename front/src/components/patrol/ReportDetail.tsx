"use client";

import { useMemo } from "react";

import type {
  DynamicAnswerRow,
  ReportDetailDoc,
  ReportSource,
} from "@/types/report-detail";
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
import { labelForQuestion, labelForStep } from "@/services/process-labels";
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
 * `accident.dynamic_answers` — what the officer actually filled in, in Persian.
 *
 * A stored row is `{step_key, question_key, answer}`: keys only, no text. On a report
 * filed through the built-in patrol form that means the *entire* body of the report —
 * 27 rows on `REP-2026-4423441`, the very report whose detail page this is — would read
 * as `direction`, `lane`, `vehicles[0].driver[0].driver_health`. `labelForQuestion`
 * resolves those keys against the same `qaAccidentFormDefinition` the app files
 * through, which already ships with Persian labels, so nothing extra is fetched.
 *
 * Rows are grouped under their step, because that is the order the officer gave them
 * and a flat list of 27 label/value pairs is unreadable regardless of how good the
 * labels are.
 *
 * ## An unresolved key is shown, not hidden
 *
 * When a key is absent from the built-in form the raw key is rendered instead, and the
 * section says so. A visible English key is a defect a reader can report; a fabricated
 * or borrowed label is a defect they cannot. That is the whole reason this falls back
 * rather than skipping the row — a skipped answer would read as "nothing was recorded",
 * which is false.
 */
function DynamicAnswers({ answers }: { answers: DynamicAnswerRow[] }) {
  const groups = useMemo(() => groupByStep(answers), [answers]);
  const resolved = answers.filter(
    (answer) => labelForQuestion(answer.question_key) !== undefined,
  ).length;
  const anyLabel = resolved > 0;

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-white">پاسخ‌های مأمور</h2>
        <span className="text-xs text-slate-500">
          {answers.length.toLocaleString("fa-IR")} مورد
        </span>
      </div>

      {groups.map((group) => (
        <div key={group.stepKey} className="mb-4 last:mb-0">
          <h3 className="mb-2 text-xs font-semibold text-cyan-200">
            {group.title}
          </h3>
          <dl className="divide-y divide-white/5">
            {group.rows.map((row) => (
              <div
                key={`${row.stepKey}:${row.path}`}
                className="flex flex-wrap gap-x-3 gap-y-1 py-2"
              >
                <dt className="min-w-[10rem] text-xs text-slate-400">
                  {row.group && (
                    <span className="ml-1.5 text-slate-600">{row.group}</span>
                  )}
                  {row.label}
                </dt>
                <dd className="flex-1 text-xs leading-6 text-slate-100">
                  {row.text}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}

      {anyLabel ? (
        resolved < answers.length && (
          <p className="mt-3 rounded-xl border border-white/10 bg-white/[.03] p-3 text-[11px] leading-6 text-slate-500">
            {`${(answers.length - resolved).toLocaleString("fa-IR")} پاسخ با کلید خام نمایش داده شده‌اند، چون در فرم داخلی اپ تعریف نشده‌اند.`}
          </p>
        )
      ) : (
        <p className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs leading-6 text-amber-100">
          این گزارش با فرمی خارج از فرم داخلی اپ ثبت شده است، بنابراین عنوان پرسش‌ها
          در دسترس نیست و کلیدهای خام نمایش داده می‌شوند.
        </p>
      )}
    </section>
  );
}

type AnswerLine = {
  stepKey: string;
  path: string;
  label: string;
  group?: string;
  text: string;
};

type AnswerGroup = { stepKey: string; title: string; rows: AnswerLine[] };

function groupByStep(answers: DynamicAnswerRow[]): AnswerGroup[] {
  const groups = new Map<string, AnswerGroup>();

  for (const answer of answers) {
    const stepKey = answer.step_key ?? "";
    const resolved = labelForQuestion(answer.question_key);
    const text = answerText(answer);

    const group = groups.get(stepKey) ?? {
      stepKey,
      // An unknown step keeps its key visible rather than being dropped or given an
      // invented heading.
      title: labelForStep(stepKey) ?? stepKey ?? "سایر",
      rows: [],
    };
    group.rows.push({
      stepKey,
      path: answer.question_key,
      label: resolved?.label ?? answer.question_key,
      group: repeatLabel(resolved),
      text,
    });
    groups.set(stepKey, group);
  }

  return [...groups.values()];
}

/** `خودرو ۱ —` for a repeatable instance, omitted for a top-level question. */
const repeatLabel = (resolved: ReturnType<typeof labelForQuestion>): string | undefined => {
  if (!resolved?.group) return undefined;
  const ordinal = (resolved.row ?? 0) + 1;
  return `${resolved.group} ${ordinal.toLocaleString("fa-IR")} —`;
};

/**
 * The answer, resolved to text.
 *
 * A multi-value answer keeps its labels in `answer_names`; a single reference answer
 * keeps the id in `answer_id` and its label in `answer_name`. A reference with no
 * snapshot — an option deleted since the report was filed — has only the id, and
 * showing an id beats showing nothing.
 */
function answerText(answer: DynamicAnswerRow): string {
  if (answer.answer_names?.length) return answer.answer_names.join("، ");
  if (answer.answer_name) return answer.answer_name;
  if (answer.value) return answer.value;
  if (answer.answer_ids?.length) return answer.answer_ids.join("، ");
  if (answer.answer_id) return answer.answer_id;
  return "—";
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