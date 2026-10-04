"use client";
import React from "react";

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id?: string;
  className?: string;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  checked,
  onChange,
  label,
  id,
  className = "",
}) => {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3 transition-colors duration-200 ${
        checked
          ? "border-blue-400/30 bg-blue-400/10"
          : "border-white/10 hover:bg-white/5"
      } ${className}`}
    >
      <div
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        onClick={() => onChange(!checked)}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            onChange(!checked);
          }
        }}
        className={`relative flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-colors duration-200 ${
          checked
            ? "border-transparent bg-blue-600"
            : "border-white/15 bg-white/[.04] hover:border-blue-400/40"
        }`}
      >
        {checked && (
          <svg
            className="h-4 w-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        )}

        {/* Hidden input for form accessibility */}
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={() => onChange(!checked)}
          className="sr-only"
        />
      </div>
      <label
        htmlFor={id}
        className={`cursor-pointer text-sm font-medium transition-colors duration-200 ${
          checked ? "text-blue-200" : "text-slate-300"
        }`}
      >
        {label}
      </label>
    </div>
  );
};

export default CustomCheckbox;