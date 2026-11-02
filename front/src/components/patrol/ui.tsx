"use client";

import React from "react";
import { Button } from "@/components/atoms/Button";

export function PanelCard({
  title,
  action,
  className = "",
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border border-line bg-surface/75 p-5 shadow-xl ${className}`}
    >
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-semibold text-fg">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line-strong bg-surface-sunken p-10 text-center text-sm text-fg-faint">
      {message}
    </div>
  );
}

export function Notice({
  tone,
  children,
}: {
  tone: "rose" | "emerald" | "amber";
  children: React.ReactNode;
}) {
  const tones = {
    rose: "tint-rose border-tint-border bg-tint-soft text-tint-fg",
    emerald: "tint-emerald border-tint-border bg-tint-soft text-tint-fg",
    amber: "tint-amber border-tint-border bg-tint-soft text-tint-fg",
  } as const;
  return (
    <div className={`rounded-xl border p-3 text-sm leading-6 ${tones[tone]}`}>
      {children}
    </div>
  );
}

export function PageSkeleton({ blocks = [80, 192, 256] }: { blocks?: number[] }) {
  return (
    <div className="animate-pulse space-y-5">
      {blocks.map((height, index) => (
        <div key={index} className="rounded-2xl bg-surface-hover" style={{ height }} />
      ))}
    </div>
  );
}

export function RetryErrorBox({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="tint-rose rounded-2xl border border-tint-border bg-tint-soft p-8 text-center text-sm text-tint-fg">
      <p>{message}</p>
      <Button variant="neutral" size="sm" className="mx-auto mt-4" onClick={onRetry}>
        تلاش دوباره
      </Button>
    </div>
  );
}

export function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-fg-faint">{label}</p>
      <p className="mt-1 break-words text-fg">{value || "در دسترس نیست"}</p>
    </div>
  );
}
