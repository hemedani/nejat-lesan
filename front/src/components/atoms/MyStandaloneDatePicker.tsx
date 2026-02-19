"use client";
import React from "react";
import DatePicker from "react-multi-date-picker";
import type { Value } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

interface StandaloneDatePickerProps {
  value?: Date | string | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClass?: string;
  format?: string;
  label?: string;
  error?: string;
}

const MyStandaloneDatePicker: React.FC<StandaloneDatePickerProps> = ({
  value,
  onChange,
  placeholder = "انتخاب تاریخ",
  disabled = false,
  className = "",
  inputClass = "",
  format = "YYYY/MM/DD",
  label,
  error,
}) => {
  const handleChange = (date: Value) => {
    if (date) {
      let dateValue: Date;
      if (typeof date === "string" || typeof date === "number") {
        dateValue = new Date(date);
      } else if (date instanceof Date) {
        dateValue = date;
      } else {
        // DateObject type
        dateValue = date.toDate();
      }
      onChange(dateValue);
    } else {
      onChange(null);
    }
  };

  const dateValue = value ? new Date(value) : undefined;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <DatePicker
        portal
        value={dateValue}
        onChange={handleChange}
        calendar={persian}
        locale={persian_fa}
        format={format}
        calendarPosition="bottom-right"
        disabled={disabled}
        containerClassName="w-full"
        inputClass={
          inputClass ||
          `
            w-full px-4 py-3 text-slate-800 bg-white border rounded-xl
            placeholder:text-slate-400 text-right
            transition-all duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:border-blue-500
            hover:border-slate-400
            ${disabled ? "bg-slate-100 cursor-not-allowed opacity-60" : "hover:bg-slate-50/50"}
            ${error ? "border-red-300 bg-red-50/30 focus:ring-red-500 focus:border-red-500" : "border-slate-300"}
          `
        }
        placeholder={placeholder}
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
      />

      {error && (
        <span className="text-red-500 text-xs font-medium text-right mt-1 flex items-center gap-1">
          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </span>
      )}
    </div>
  );
};

export default MyStandaloneDatePicker;
