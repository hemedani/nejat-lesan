"use client";

import React from "react";
import dynamic from "next/dynamic";
import { CSSObjectWithLabel } from "react-select";

// Single select component that stores both _id and name
const MySelectWithName = dynamic(
  () =>
    import("react-select/async").then((mod) => {
      const AsyncSelect = mod.default;
      return function MySelectWithNameComponent({
        name,
        label,
        loadOptions,
        setValue,
        defaultOptions = true,
        errMsg,
        placeholder,
      }: {
        name: string;
        label: string;
        loadOptions: (
          inputValue: string,
        ) => Promise<{ value: string; label: string }[]>;
        setValue: (
          name: string,
          value: { _id: string; name: string } | null,
        ) => void;
        defaultOptions?: boolean;
        errMsg?: string;
        placeholder?: string;
      }) {
        return (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700 text-right">
              {label}
            </label>
            <AsyncSelect
              cacheOptions
              defaultOptions={defaultOptions}
              loadOptions={loadOptions}
              onChange={(newVal: { value: string; label: string } | null) => {
                if (newVal) {
                  setValue(name, {
                    _id: newVal.value,
                    name: newVal.label,
                  });
                } else {
                  setValue(name, null);
                }
              }}
              placeholder={placeholder || `${label} را انتخاب کنید`}
              noOptionsMessage={() => "گزینه‌ای یافت نشد"}
              loadingMessage={() => "در حال بارگذاری..."}
              isClearable
              isRtl
              styles={{
                control: (
                  provided: CSSObjectWithLabel,
                ): CSSObjectWithLabel => ({
                  ...provided,
                  minHeight: "48px",
                  borderRadius: "12px",
                  borderColor: errMsg ? "#ef4444" : "#cbd5e1",
                  direction: "rtl",
                }),
                option: (provided: CSSObjectWithLabel): CSSObjectWithLabel => ({
                  ...provided,
                  direction: "rtl",
                  textAlign: "right",
                }),
                singleValue: (
                  provided: CSSObjectWithLabel,
                ): CSSObjectWithLabel => ({
                  ...provided,
                  direction: "rtl",
                }),
              }}
            />
            {errMsg && (
              <span className="text-red-500 text-xs font-medium text-right mt-1">
                {errMsg}
              </span>
            )}
          </div>
        );
      };
    }),
  { ssr: false },
);

export default MySelectWithName;
