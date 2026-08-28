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
      className={`rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-xl ${className}`}
    >
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-semibold text-white">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[.02] p-10 text-center text-sm text-slate-500">
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
    rose: "border-rose-400/20 bg-rose-400/10 text-rose-100",
    emerald: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
    amber: "border-amber-400/20 bg-amber-400/5 text-amber-100",
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
        <div key={index} className="rounded-2xl bg-white/5" style={{ height }} />
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
    <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-8 text-center text-sm text-rose-100">
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
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 break-words text-slate-200">{value || "در دسترس نیست"}</p>
    </div>
  );
}
