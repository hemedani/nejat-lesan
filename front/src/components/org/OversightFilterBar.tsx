"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/atoms/Button";
import MyInput from "@/components/atoms/MyInput";
import { FilterPill } from "@/components/org/FilterPill";
import { reviewStatusMeta, syncStatusMeta } from "@/utils/patrol-status";
import type { OversightFilters } from "@/services/report-sources";
import type { ReviewStatus, SyncStatus } from "@/types/patrol";

const SYNC_STATUSES = Object.keys(syncStatusMeta) as SyncStatus[];
const REVIEW_STATUSES = Object.keys(reviewStatusMeta) as ReviewStatus[];

/**
 * The keys the "N filters active" badge counts.
 *
 * Named rather than derived by destructuring the rest object: `organizationId`,
 * `page` and `limit` have to be excluded — the first is the scope the view owns,
 * the other two are paging — and a destructuring rest pattern would bind three
 * variables only to leave them unread, which this ESLint config reports as three
 * errors.
 *
 * A `Record` rather than an array so it stays exhaustive: adding a filter to
 * `OversightFilters` is a compile error here until someone decides whether the
 * badge counts it, rather than a filter the badge silently ignores.
 */
type FilterKey = Exclude<keyof OversightFilters, "organizationId" | "page" | "limit">;

const FILTER_KEYS: Record<FilterKey, true> = {
  dateFrom: true,
  dateTo: true,
  groupKeys: true,
  syncStatus: true,
  reviewStatus: true,
  officerIds: true,
  appVersions: true,
  unlinkedOnly: true,
  search: true,
};

/** Add or remove one value from a multi-select filter. */
const toggle = <T,>(list: T[] | undefined, value: T): T[] => {
  const current = list ?? [];
  return current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
};

const countActive = (value: OversightFilters): number =>
  (Object.keys(FILTER_KEYS) as FilterKey[]).filter((key) => {
    const entry = value[key];
    if (Array.isArray(entry)) return entry.length > 0;
    if (typeof entry === "string") return entry.length > 0;
    return Boolean(entry);
  }).length;

/**
 * Every control the oversight acts accept, in one controlled bar.
 *
 * Fully controlled: the view owns the filter state because it lives in the URL, and
 * this bar is only its keyboard. Each control offers only values that exist — the
 * forms come from the organization's definitions, the officers and app versions out
 * of a statistics request the current filter does not narrow — so there is nothing
 * here that can filter to an empty result by being a value nobody ever filed under.
 *
 * The search box is submitted, not typed into: the parent turns every change into a
 * URL, and a URL per keystroke would mean a request per keystroke.
 */
export function OversightFilterBar({
  value,
  forms,
  officers,
  appVersions,
  onChange,
  onReset,
  formsError = false,
  optionsError = false,
}: {
  value: OversightFilters;
  forms: Array<{ groupKey: string; title: string; icon?: string }>;
  officers: Array<{ _id: string; label: string }>;
  appVersions: string[];
  onChange: (next: OversightFilters) => void;
  onReset: () => void;
  /** Shown as a footnote when the form list could not be read; the rest still works. */
  formsError?: boolean;
  /** The same, for the officer and app-version lists. */
  optionsError?: boolean;
}) {
  const [searchDraft, setSearchDraft] = useState(value.search ?? "");

  // The draft is the user's, so it is only overwritten when the filter it belongs
  // to changes elsewhere — a reset, or a shared link landing on this bar.
  useEffect(() => {
    setSearchDraft(value.search ?? "");
  }, [value.search]);

  const change = (next: OversightFilters) => onChange(next);
  const activeCount = countActive(value);

  return (
    <section className="mb-5 rounded-2xl border border-white/10 bg-slate-900/75 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-white">فیلترها</h2>
        {activeCount > 0 && (
          <span className="rounded-full border border-blue-400/40 bg-blue-400/10 px-2.5 py-0.5 text-[10px] text-blue-100">
            {activeCount.toLocaleString("fa-IR")} فیلتر فعال
          </span>
        )}
      </div>

      <div className="space-y-4">
        <Field label="نوع گزارش">
          <FilterPill
            active={!value.groupKeys?.length}
            label="همه رخدادها"
            onClick={() => change({ ...value, groupKeys: undefined })}
          />
          {forms.map((form) => {
            const selected = value.groupKeys?.includes(form.groupKey) ?? false;
            return (
              <FilterPill
                key={form.groupKey}
                active={selected}
                icon={form.icon}
                label={form.title}
                onClick={() =>
                  change({ ...value, groupKeys: toggle(value.groupKeys, form.groupKey) })
                }
              />
            );
          })}
        </Field>
        {formsError && (
          <p className="text-xs text-amber-200">
            فهرست فرم‌های این سازمان خوانده نشد؛ فیلتر نوع گزارش فعلاً فقط تصادف را پیشنهاد می‌کند.
          </p>
        )}

        <Field label="وضعیت همگام‌سازی">
          {SYNC_STATUSES.map((status) => {
            const selected = value.syncStatus?.includes(status) ?? false;
            return (
              <FilterPill
                key={status}
                active={selected}
                label={syncStatusMeta[status].label}
                onClick={() =>
                  change({ ...value, syncStatus: toggle(value.syncStatus, status) })
                }
              />
            );
          })}
        </Field>

        <Field label="وضعیت بررسی">
          {REVIEW_STATUSES.map((status) => {
            const selected = value.reviewStatus?.includes(status) ?? false;
            return (
              <FilterPill
                key={status}
                active={selected}
                label={reviewStatusMeta[status].label}
                onClick={() =>
                  change({ ...value, reviewStatus: toggle(value.reviewStatus, status) })
                }
              />
            );
          })}
        </Field>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MyInput
            variant="dark"
            type="date"
            name="dateFrom"
            label="از تاریخ"
            value={value.dateFrom ?? ""}
            onValueChange={(next) => change({ ...value, dateFrom: next || undefined })}
          />
          <MyInput
            variant="dark"
            type="date"
            name="dateTo"
            label="تا تاریخ"
            value={value.dateTo ?? ""}
            onValueChange={(next) => change({ ...value, dateTo: next || undefined })}
          />
          <form
            className="flex items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              change({ ...value, search: searchDraft.trim() || undefined });
            }}
          >
            <MyInput
              variant="dark"
              type="search"
              name="search"
              label="جستجو"
              placeholder="شناسه، شرح یا عنوان فرم"
              className="flex-1"
              value={searchDraft}
              onValueChange={setSearchDraft}
            />
            <Button type="submit" size="sm" className="mb-1">
              جستجو
            </Button>
          </form>
          <label className="flex cursor-pointer items-center gap-2 pb-2 text-xs text-slate-300">
            <input
              type="checkbox"
              className="accent-blue-500"
              checked={value.unlinkedOnly ?? false}
              onChange={(event) =>
                change({ ...value, unlinkedOnly: event.target.checked || undefined })
              }
            />
            فقط گزارش‌های بدون سازمان
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {officers.length > 0 && (
            <Disclosure label={`گزارش‌دهنده (${officers.length.toLocaleString("fa-IR")})`}>
              <div className="max-h-56 space-y-1 overflow-y-auto">
                {officers.map((officer) => {
                  const checked = value.officerIds?.includes(officer._id) ?? false;
                  return (
                    <CheckRow
                      key={officer._id}
                      checked={checked}
                      label={officer.label}
                      onChange={() =>
                        change({ ...value, officerIds: toggle(value.officerIds, officer._id) })
                      }
                    />
                  );
                })}
              </div>
            </Disclosure>
          )}

          {appVersions.length > 0 && (
            <Disclosure label={`نسخهٔ اپلیکیشن (${appVersions.length.toLocaleString("fa-IR")})`}>
              <div className="space-y-1">
                {appVersions.map((version) => {
                  const checked = value.appVersions?.includes(version) ?? false;
                  return (
                    <CheckRow
                      key={version}
                      checked={checked}
                      label={version}
                      onChange={() =>
                        change({ ...value, appVersions: toggle(value.appVersions, version) })
                      }
                    />
                  );
                })}
              </div>
            </Disclosure>
          )}

          {activeCount > 0 && (
            <Button variant="neutral" size="sm" onClick={onReset} className="self-end">
              بازنشانی فیلترها
            </Button>
          )}
        </div>

        {optionsError && (
          <p className="mt-3 text-xs text-amber-200">
            فهرست گزارش‌دهندگان و نسخه‌های اپ خوانده نشد؛ این دو فیلتر فعلاً گزینه‌ای برای
            انتخاب ندارند.
          </p>
        )}
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs text-slate-500">{label}</p>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

/**
 * A collapsed list of choices.
 *
 * A native `<details>` rather than a popover component: the officer list is a plain
 * set of checkboxes with nothing to animate, and this needs no outside click
 * handling to behave.
 */
function Disclosure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-xl border border-white/10 bg-white/[.02]">
      <summary className="cursor-pointer px-3 py-2 text-xs text-slate-300 transition hover:text-white">
        {label}
      </summary>
      <div className="border-t border-white/10 p-3">{children}</div>
    </details>
  );
}

function CheckRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition hover:bg-white/5 ${
        checked ? "border-blue-400/50 text-blue-100" : "border-transparent text-slate-300"
      }`}
    >
      <input type="checkbox" className="accent-blue-500" checked={checked} onChange={onChange} />
      <span className="truncate">{label}</span>
    </label>
  );
}