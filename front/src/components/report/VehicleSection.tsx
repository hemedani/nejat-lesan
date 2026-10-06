"use client";

import type { VehicleDto } from "@/types/report-detail";
import { readPlate } from "@/types/report-detail";
import {
  Collapsible,
  Field,
  FieldGrid,
  Pill,
  SectionTitle,
  joinNames,
} from "@/components/report/kit";
import { formatNumber } from "@/utils/formatters";

/**
 * One card per vehicle.
 *
 * **Always visible:** plate, fault status, final status, driver name. Those four
 * are what a reviewer scans a report for, and they are the only ones on the card
 * that cannot be inferred from the others.
 *
 * **Behind «جزئیات بیشتر»:** everything else — both insurances, the licence, the
 * driver's national code and phone, the vehicle's type and year, the passengers
 * and the damaged sections. Twelve fields per card times two cars is taller than a
 * laptop viewport, so a card that showed everything would push the *next* vehicle
 * off-screen and turn the section into a scroll of its own.
 *
 * A card with nothing to reveal renders no toggle at all — a control that opens
 * onto an empty panel is worse than its absence.
 */
export function VehicleSection({
  vehicles,
}: {
  vehicles?: VehicleDto[];
}) {
  if (!vehicles?.length) return null;

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-4">
      <SectionTitle count={vehicles.length}>خودروها</SectionTitle>
      <div className="space-y-2.5">
        {vehicles.map((vehicle, index) => (
          <VehicleCard
            key={`${vehicle.plaque_no?.[0] ?? "vehicle"}-${index}`}
            vehicle={vehicle}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}

function VehicleCard({
  vehicle,
  index,
}: {
  vehicle: VehicleDto;
  index: number;
}) {
  const plate = readPlate(vehicle.plaque_no);
  const driver = vehicle.driver;
  const passengers = vehicle.passenger_dtos ?? [];
  const damageSections = vehicle.max_damage_sections ?? [];

  return (
    <article className="rounded-xl border border-white/10 bg-white/[.02] p-3">
      <header className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <span
          className="text-sm font-bold text-white"
          dir="ltr"
          title={plate ? undefined : "پلاک ثبت نشده"}
        >
          {plate ?? `خودروی ${formatNumber(index + 1)}`}
        </span>
        <span className="flex flex-wrap items-center gap-1.5">
          {vehicle.fault_status?.name && (
            <Pill
              tone={
                // `fault_status` is a reference whose `name` is free text, so the
                // fault/no-fault split is read from the name rather than from a
                // code. Anything unrecognised stays neutral instead of guessing.
                /مقصر|مسئول|-fault/i.test(vehicle.fault_status.name)
                  ? "rose"
                  : "slate"
              }
            >
              {vehicle.fault_status.name}
            </Pill>
          )}
          {vehicle.final_status?.name && (
            <Pill>{vehicle.final_status.name}</Pill>
          )}
        </span>
      </header>

      <FieldGrid>
        <Field label="راننده" value={fullName(driver?.first_name, driver?.last_name)} />
        <Field label="رنگ" value={vehicle.color?.name} />
      </FieldGrid>

      <Collapsible>
        <FieldGrid>
          <Field label="کد ملی راننده" value={driver?.national_code} ltr />
          <Field label="تلفن راننده" value={driver?.phone} ltr />
          <Field label="وضعیت راننده" value={driver?.driver_status?.name} />
          <Field label="گواهینامه" value={driver?.licence_type?.name} />
          <Field label="شماره گواهینامه" value={driver?.licence_number} ltr />
          <Field label="مصدومیت راننده" value={driver?.injury_type?.name} />
          <Field label="نوع خودرو" value={vehicle.vehicle_type?.name} />
          <Field
            label="سال ساخت"
            value={vehicle.year == null ? undefined : formatNumber(vehicle.year)}
          />
          <Field label="بیمه شخصی" value={vehicle.insurance_co?.name} />
          <Field label="شماره بیمه شخصی" value={vehicle.insurance_no} ltr />
          <Field label="بیمه بدنه" value={vehicle.body_insurance_co?.name} />
          <Field label="شماره بیمه بدنه" value={vehicle.body_insurance_no} ltr />
          <Field
            label="سرنشین‌ها"
            value={
              passengers.length
                ? passengers
                    .map((person) => fullName(person.first_name, person.last_name))
                    .filter(Boolean)
                    .join("، ")
                : undefined
            }
          />
        </FieldGrid>

        {damageSections.length > 0 && (
          <p className="mt-2 rounded-lg bg-white/[.03] p-2 text-[11px] leading-5 text-slate-400">
            قطعات آسیب‌دیده:{" "}
            <span className="text-slate-200">
              {joinNames(damageSections.map((part) => part.name))}
            </span>
            {vehicle.damage_section_other && ` — ${vehicle.damage_section_other}`}
          </p>
        )}
      </Collapsible>
    </article>
  );
}

const fullName = (first?: string, last?: string): string | undefined => {
  const joined = [first, last].filter(Boolean).join(" ").trim();
  return joined || undefined;
};