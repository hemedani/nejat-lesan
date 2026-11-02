"use client";

import { FormIcon } from "@/components/org/forms/FormIcon";

/**
 * The console's filter toggle.
 *
 * Shared rather than kept inside the view: the oversight console has two surfaces
 * that toggle a filter set — the form pills and the status pills — and a copy per
 * surface is how two filters end up looking like two different products.
 */
export function FilterPill({
  active,
  label,
  onClick,
  icon,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  icon?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
        active
          ? "tint-blue border-tint-border bg-tint-soft text-tint-fg"
          : "border-line text-fg-muted hover:bg-surface-hover hover:text-fg"
      }`}
    >
      {/* The icon is the one the organization's form declared, so the pill and the
          form look the same here and on the officer's phone. */}
      <FormIcon name={icon} size={13} />
      {label}
    </button>
  );
}