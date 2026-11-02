"use client";

import { useId, useState, type ReactNode } from "react";

/**
 * Primitives shared by the report detail sections.
 *
 * `PanelCard`, `InfoRow`, `Notice` and friends already live in
 * `components/patrol/ui.tsx` and are reused as-is. What is here is only what the
 * detail page adds on top: a metric tile, a denser label/value grid than
 * `InfoRow`'s one-per-row default, a status pill, and a disclosure.
 */

/** One number in the summary rail, coloured by how bad it is. */
export function MetricTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "rose" | "amber";
}) {
  const tones = {
    neutral: "text-fg",
    rose: "text-rose-400",
    amber: "text-amber-400",
  } as const;
  return (
    <div className="rounded-xl bg-surface-sunken px-3 py-2">
      <p className="text-[10px] text-fg-faint">{label}</p>
      <p className={`mt-0.5 text-lg font-bold leading-tight ${tones[tone]}`}>
        {value.toLocaleString("fa-IR")}
      </p>
    </div>
  );
}

/**
 * One labelled value.
 *
 * `InfoRow` in `patrol/ui.tsx` is the panel-wide equivalent; this variant is denser
 * and lives inside a grid, which is what a vehicle card with a dozen fields needs.
 * `ltr` marks the values that are codes rather than prose — a national number, a
 * policy number, a plate — so the bidi algorithm does not reorder them.
 */
export function Field({
  label,
  value,
  ltr = false,
}: {
  label: string;
  value?: string | number | null;
  ltr?: boolean;
}) {
  const empty = value === undefined || value === null || value === "";
  return (
    <div className="rounded-lg bg-surface-sunken px-2.5 py-1.5">
      <p className="text-[10px] leading-tight text-fg-faint">{label}</p>
      <p
        className={`mt-0.5 text-xs leading-snug ${empty ? "text-fg-faint" : "text-fg"}`}
        dir={!empty && ltr ? "ltr" : undefined}
      >
        {empty ? "ثبت نشده" : value}
      </p>
    </div>
  );
}

/**
 * A two-column grid of `Field`s.
 *
 * One column below `sm`, because a twelve-field card at two columns on a phone
 * puts each value at roughly nine characters wide.
 */
export function FieldGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">{children}</div>
  );
}

/** A small status pill. `tone` is chosen by the caller, never inferred here. */
export function Pill({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "rose" | "amber" | "emerald";
}) {
  const tones = {
    slate: "border-line bg-surface-sunken text-fg-muted",
    rose: "tint-rose border-tint-border bg-tint-soft text-tint-fg",
    amber: "tint-amber border-tint-border bg-tint-soft text-tint-fg",
    emerald: "tint-emerald border-tint-border bg-tint-soft text-tint-fg",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** A section heading with an optional count, used above every card group. */
export function SectionTitle({
  children,
  count,
}: {
  children: ReactNode;
  count?: number;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-sm font-semibold text-fg">{children}</h2>
      {count !== undefined && (
        <span className="text-xs text-fg-faint">
          {count.toLocaleString("fa-IR")}
        </span>
      )}
    </div>
  );
}

/**
 * A disclosure, for the fields a reviewer scans past.
 *
 * The vehicle card shows plate, fault status, final status and driver name
 * always, and puts national code, phone, both insurances, the licence and the
 * passengers behind this. Twelve fields per card times two cards is taller than a
 * laptop viewport, and the four always-visible ones are the ones actually scanned
 * for. The trigger renders nothing at all when there is nothing to reveal — a
 * disabled «جزئیات بیشتر» is a worse signal than its absence.
 */
export function Collapsible({
  label = "جزئیات بیشتر",
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  if (!children) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="text-[11px] text-brand-fg transition hover:underline"
      >
        {open ? "بستن جزئیات" : label}
      </button>
      <div id={panelId} hidden={!open} className="mt-2">
        {open ? children : null}
      </div>
    </div>
  );
}

/** Join reference names for a multi-valued relation, or nothing. */
export const joinNames = (names: Array<string | undefined>): string | undefined => {
  const joined = names.filter((name): name is string => Boolean(name && name.trim()));
  return joined.length ? joined.join("، ") : undefined;
};