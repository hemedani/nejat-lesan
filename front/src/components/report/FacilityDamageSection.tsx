"use client";

import type { FacilityDamageDto } from "@/types/report-detail";
import { Field, Pill, SectionTitle } from "@/components/report/kit";
import { formatNumber } from "@/utils/formatters";

/**
 * One card per damaged public asset.
 *
 * `creates_hazard` is the field that changes what happens next — an asset flagged
 * as a hazard needs a crew before the report can be closed, so it is the one
 * boolean promoted out of the grid and onto the card's header where it cannot be
 * missed while scrolling.
 */
export function FacilityDamageSection({
  damages,
}: {
  damages?: FacilityDamageDto[];
}) {
  if (!damages?.length) return null;

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-4">
      <SectionTitle count={damages.length}>خسارت به تأسیسات</SectionTitle>
      <div className="space-y-2.5">
        {damages.map((damage, index) => (
          <article
            key={`${damage.asset_group?.name ?? "asset"}-${index}`}
            className="rounded-xl border border-white/10 bg-white/[.02] p-3"
          >
            <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-100">
                {damage.asset_group?.name ?? "تأسیسات نامشخص"}
                {damage.asset_code && (
                  <span className="mr-1.5 font-normal text-slate-500" dir="ltr">
                    {damage.asset_code}
                  </span>
                )}
              </span>
              <span className="flex flex-wrap items-center gap-1.5">
                {damage.damage_severity?.name && (
                  <Pill
                    tone={
                      /زیاد|شدید|heavy|severe/i.test(damage.damage_severity.name)
                        ? "rose"
                        : "amber"
                    }
                  >
                    {damage.damage_severity.name}
                  </Pill>
                )}
                {damage.creates_hazard && <Pill tone="rose">ایجاد خطر</Pill>}
              </span>
            </header>

            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              <Field
                label="مقدار"
                value={
                  damage.quantity == null
                    ? undefined
                    : `${formatNumber(damage.quantity)}${
                        damage.unit ? ` ${damage.unit}` : ""
                      }`
                }
              />
              <Field label="نوع خسارت" value={damage.damage_type} />
              <Field label="نیاز به تعمیر" value={yesNo(damage.needs_repair)} />
              <Field label="اقدام موقت" value={damage.temporary_action} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

const yesNo = (value?: boolean): string | undefined =>
  value === undefined || value === null ? undefined : value ? "بله" : "خیر";