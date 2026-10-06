"use client";

import type { PeopleDto, PedestrianDto } from "@/types/report-detail";
import { Pill, SectionTitle } from "@/components/report/kit";
import { formatNumber } from "@/utils/formatters";

/**
 * One card per person involved.
 *
 * Two populations land here. `people_dtos` is the unified Phase-5 list — every
 * person the officer recorded, each with a `role` (driver / passenger /
 * pedestrian). `pedestrian_dtos` is the older, narrower array that predates it and
 * carries no role. When both exist for the same person the unified entry wins, so
 * a report that was filled in on an older app build and later edited does not show
 * somebody twice.
 *
 * `injury_status` is a reference whose `name` is free Persian text, so the
 * severity tone is read from the name and anything unrecognised stays neutral
 * rather than being guessed into a colour that would misstate the record.
 */
export function PeopleSection({
  people,
  pedestrians,
}: {
  people?: PeopleDto[];
  pedestrians?: PedestrianDto[];
}) {
  const cards = buildCards(people, pedestrians);
  if (!cards.length) return null;

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-4">
      <SectionTitle count={cards.length}>افراد</SectionTitle>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {cards.map((card, index) => (
          <article
            key={`${card.name ?? "person"}-${index}`}
            className="rounded-xl border border-white/10 bg-white/[.02] p-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-semibold text-slate-100">
                {card.name ?? "نامشخص"}
              </span>
              {card.injury && <Pill tone={injuryTone(card.injury)}>{card.injury}</Pill>}
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              {[
                card.role,
                SEX_LABELS[card.sex ?? ""],
                card.age != null ? `${formatNumber(card.age)} ساله` : card.ageRange,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {card.nationalCode && (
              <p className="mt-1 text-[10px] text-slate-500" dir="ltr">
                {card.nationalCode}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

type PersonCard = {
  name?: string;
  role?: string;
  sex?: string;
  age?: number;
  ageRange?: string;
  injury?: string;
  nationalCode?: string;
};

const SEX_LABELS: Record<string, string> = {
  Male: "مرد",
  Female: "زن",
  Other: "سایر",
};

const name = (first?: string, last?: string): string | undefined => {
  const joined = [first, last].filter(Boolean).join(" ").trim();
  return joined || undefined;
};

function buildCards(
  people: PeopleDto[] | undefined,
  pedestrians: PedestrianDto[] | undefined,
): PersonCard[] {
  const unified: PersonCard[] = (people ?? []).map((person) => ({
    name: name(person.first_name, person.last_name),
    role: person.role?.name,
    sex: person.sex,
    age: person.age,
    ageRange: person.age_range,
    injury: person.injury_status?.name,
    nationalCode: person.national_code,
  }));

  // A pedestrian already represented in the unified list is skipped, matched on
  // national code where both sides have one and on the full name otherwise.
  const seen = new Set<string>();
  for (const card of unified) {
    if (card.nationalCode) seen.add(`code:${card.nationalCode}`);
    else if (card.name) seen.add(`name:${card.name}`);
  }

  const legacy: PersonCard[] = (pedestrians ?? [])
    .map((person) => ({
      name: name(person.first_name, person.last_name),
      // No role on the legacy array: being in it *is* the role.
      role: "عابر پیاده",
      sex: person.sex,
      injury: person.injury_type?.name,
      nationalCode: person.national_code,
    }))
    .filter((card) => {
      const key = card.nationalCode
        ? `code:${card.nationalCode}`
        : card.name
          ? `name:${card.name}`
          : null;
      return key ? !seen.has(key) : true;
    });

  return [...unified, ...legacy];
}

function injuryTone(injury: string) {
  if (/فوت|مرگ|death/i.test(injury)) return "rose" as const;
  if (/مصدوم|مجروح|injury/i.test(injury)) return "amber" as const;
  return "slate" as const;
}