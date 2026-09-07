"use client";

import type { ReactNode } from "react";
import SelectBox from "@/components/atoms/Select";
import { ReactSelectOption } from "@/types/option";

export interface OrgSelectOption {
  value: string;
  label: string;
}

/** Single-select form input — thin wrapper over the project-standard SelectBox. */
export function OrgSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  errMsg,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: OrgSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  errMsg?: string;
}) {
  return (
    <SelectBox
      label={label}
      value={value}
      onValueChange={onChange}
      options={options as ReactSelectOption[]}
      placeholder={placeholder}
      errMsg={errMsg}
      disabled={disabled}
      clearable={false}
      className="w-full"
    />
  );
}

/** Compact inline filter — also the project-standard select. */
export function OrgFilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: OrgSelectOption[];
}) {
  return (
    <SelectBox
      value={value}
      onValueChange={onChange}
      options={options as ReactSelectOption[]}
      clearable={false}
      className="min-w-44"
    />
  );
}

export function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" dir="rtl">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 transition hover:bg-white/5 hover:text-white" aria-label="بستن">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
