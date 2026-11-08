import React from "react";

interface MockFrameProps {
  title: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Chrome for the simulated product screens in the platform tour.
 *
 * It is a *picture* of the app, not the app: nothing here is interactive, so it
 * can be a server component and cost no JavaScript.
 */
export function MockFrame({ title, badge, children, className = "" }: MockFrameProps) {
  return (
    <div
      className={`relative rounded-[26px] border border-line bg-surface p-2 shadow-[0_30px_80px_-40px_rgba(2,6,23,0.65)] ${className}`}
    >
      <div className="overflow-hidden rounded-[20px] border border-line bg-surface-sunken">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-surface/70 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
            <span className="text-[11px] font-medium text-fg-muted">{title}</span>
          </div>
          {badge ? (
            <span className="rounded-md border border-line bg-surface px-2 py-0.5 text-[10px] text-fg-faint">
              {badge}
            </span>
          ) : null}
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

const PILL_TONES = {
  success: "tint-success text-tint-fg border-tint-border bg-tint-soft",
  warning: "tint-warning text-tint-fg border-tint-border bg-tint-soft",
  danger: "tint-danger text-tint-fg border-tint-border bg-tint-soft",
  info: "tint-info text-tint-fg border-tint-border bg-tint-soft",
  neutral: "text-fg-muted border-line bg-surface",
} as const;

interface StatusPillProps {
  tone?: keyof typeof PILL_TONES;
  children: React.ReactNode;
  className?: string;
}

export function StatusPill({ tone = "neutral", children, className = "" }: StatusPillProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${PILL_TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/** A fake toggle, drawn rather than wired. */
export function MockSwitch({ on }: { on: boolean }) {
  return (
    <span
      className={`flex h-4 w-8 shrink-0 items-center rounded-full p-0.5 transition ${
        on ? "justify-start bg-success" : "justify-end bg-line-strong"
      }`}
      aria-hidden="true"
    >
      <span className="h-3 w-3 rounded-full bg-white shadow-sm" />
    </span>
  );
}
