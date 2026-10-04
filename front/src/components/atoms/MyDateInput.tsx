"use client";
import React from "react";
import { FieldPath, FieldValues, Control, Controller } from "react-hook-form";
import DatePicker from "react-multi-date-picker";
import type { Value } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

interface DateInputProps<T extends FieldValues = FieldValues> {
  name: FieldPath<T>;
  label: string;
  control: Control<T>;
  className?: string;
  errMsg?: string;
  placeholder?: string;
  disabled?: boolean;
  customShowDateFormat?: string;
  portalZIndex?: number;
}

const MyDateInput = <T extends FieldValues = FieldValues>({
  className,
  errMsg,
  name,
  label,
  placeholder,
  control,
  disabled = false,
  customShowDateFormat = "YYYY/MM/DD",
  portalZIndex = 9999,
}: DateInputProps<T>) => {
  return (
    <div className={`flex flex-col gap-2 ${className || ""}`}>
      <label htmlFor={name} className="text-sm font-medium text-slate-300 text-right">
        {label}
      </label>

      <Controller
        name={name}
        control={control}
        render={({ field: { onChange, value } }) => (
          <div className="relative">
            <DatePicker
              portal
              value={value ? new Date(value) : undefined}
              onChange={(date: Value) => {
                if (date) {
                  // Convert to ISO string for consistent storage
                  let dateValue: Date;
                  if (typeof date === "string" || typeof date === "number") {
                    dateValue = new Date(date);
                  } else if (date instanceof Date) {
                    dateValue = date;
                  } else {
                    // DateObject type
                    dateValue = date.toDate();
                  }
                  onChange(dateValue.toISOString());
                } else {
                  onChange(null);
                }
              }}
              arrowClassName="z-index-calendar"
              calendar={persian}
              locale={persian_fa}
              format={customShowDateFormat}
              calendarPosition="bottom-right"
              disabled={disabled}
              containerClassName="w-full"
              inputClass={`
                w-full pr-4 pl-10 py-2.5 text-sm text-white bg-white/[.04] border rounded-xl
                placeholder:text-slate-600 text-right
                transition-colors duration-200
                focus:outline-none focus:border-blue-400/50
                ${disabled ? "opacity-60 cursor-not-allowed" : "hover:border-white/20"}
                ${errMsg ? "border-rose-400/50" : "border-white/10"}
              `}
              placeholder={placeholder || label}
              className="blue not-close-modal"
              style={{
                width: "100%",
              }}
              editable={false}
              portalTarget={typeof document !== "undefined" ? document.body : undefined}
              weekDays={["ش", "ی", "د", "س", "چ", "پ", "ج"]}
              months={[
                "فروردین",
                "اردیبهشت",
                "خرداد",
                "تیر",
                "مرداد",
                "شهریور",
                "مهر",
                "آبان",
                "آذر",
                "دی",
                "بهمن",
                "اسفند",
              ]}
              zIndex={portalZIndex}
            />
            {value && !disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(null);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none p-1 rounded-full hover:bg-white/10 transition-colors z-10"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
      />

      {errMsg && (
        <span className="text-rose-400 text-xs font-medium text-right mt-1 flex items-center gap-1">
          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {errMsg}
        </span>
      )}
    </div>
  );
};

export default MyDateInput;
