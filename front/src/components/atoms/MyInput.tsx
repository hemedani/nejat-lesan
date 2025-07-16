"use client";
import React from "react";
import { FieldPath, FieldValues, UseFormRegister } from "react-hook-form";

interface InputProps<T extends FieldValues = FieldValues> {
  name: FieldPath<T>;
  label: string;
  register: UseFormRegister<T>;
  className?: string;
  errMsg?: string;
  type?: string;
  placeholder?: string;
  step?: string;
}

const MyInput = <T extends FieldValues = FieldValues>({
  className,
  errMsg,
  name,
  type,
  label,
  placeholder,
  register,
  step,
}: InputProps<T>) => {
  return (
    <div className={`flex flex-col gap-2 ${className || ""}`}>
      <label
        htmlFor={name}
        className="text-sm font-medium text-slate-700 text-right"
      >
        {label}
      </label>

      {type === "textarea" ? (
        <textarea
          id={name}
          {...register(name)}
          placeholder={placeholder || label}
          className={`
            w-full px-4 py-3 text-slate-800 bg-white border rounded-xl resize-none
            placeholder:text-slate-400 text-right
            transition-all duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:border-blue-500
            hover:border-slate-400
            ${
              errMsg
                ? "border-red-300 bg-red-50/30 focus:ring-red-500 focus:border-red-500"
                : "border-slate-300 hover:bg-slate-50/50"
            }
          `}
          rows={4}
        />
      ) : (
        <input
          id={name}
          {...register(name)}
          type={type || "text"}
          placeholder={placeholder || label}
          step={step}
          className={`
            w-full px-4 py-3 text-slate-800 bg-white border rounded-xl
            placeholder:text-slate-400 text-right
            transition-all duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:border-blue-500
            hover:border-slate-400
            ${
              errMsg
                ? "border-red-300 bg-red-50/30 focus:ring-red-500 focus:border-red-500"
                : "border-slate-300 hover:bg-slate-50/50"
            }
            ${type === "date" ? "text-left" : ""}
          `}
        />
      )}

      {errMsg && (
        <span className="text-red-500 text-xs font-medium text-right mt-1 flex items-center gap-1">
          <svg
            className="w-3 h-3 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
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

export default MyInput;
