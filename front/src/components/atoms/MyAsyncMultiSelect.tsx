"use client";
import { ReactSelectOption } from "@/types/option";
import dynamic from "next/dynamic";
import React, { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { FieldPath, FieldValues, Path, PathValue, UseFormSetValue } from "react-hook-form";
import { components as defaultComponents, GroupBase, MultiValueProps, OptionsOrGroups, PropsValue } from "react-select";
import { useSelectStyles } from "@/utils/select-styles";

const AsyncSelect = dynamic(() => import("react-select/async"), { ssr: false });

export type SelectOption = { value: string; label: string };

interface InputProps<Option, Group extends GroupBase<Option>, T extends FieldValues = FieldValues> {
  name: FieldPath<T>;
  label: string;
  setValue: UseFormSetValue<T>;
  labelAsValue?: boolean;
  onChange?: (values: string[]) => void;
  errMsg?: string;
  placeholder?: string;
  loadOptions?: (inputValue: string, callback: (options: OptionsOrGroups<Option, Group>) => void) => Promise<OptionsOrGroups<Option, Group>> | void;
  defaultOptions?: OptionsOrGroups<Option, Group> | boolean;
  defaultValue?: PropsValue<Option>;
  value?: PropsValue<Option>;
  className?: string;
}

// Portal-based tooltip for multi-value chips — uses innerProps to attach handlers
// directly to the chip element, avoiding any overflow clipping from parent containers.
const MultiValueWithTooltip = (props: MultiValueProps<unknown, boolean, GroupBase<unknown>>) => {
  const label = ((props.data as SelectOption)?.label) || "";
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPos({ top: r.top, right: window.innerWidth - r.right });
    setShow(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShow(false);
  }, []);

  return (
    <>
      <defaultComponents.MultiValue
        {...props}
        innerProps={{
          ...props.innerProps,
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave,
        }}
      />
      {show &&
        createPortal(
          <div
              style={{
                position: "fixed",
                top: pos.top - 8,
                right: pos.right,
                transform: "translateY(-100%)",
                background: "var(--tooltip-bg)",
              color: "var(--tooltip-fg)",
              padding: "5px 10px",
              borderRadius: "7px",
              fontSize: "12px",
              fontFamily: "vazir-matn",
              lineHeight: 1.7,
              whiteSpace: "nowrap",
              zIndex: 99999,
              pointerEvents: "none",
              boxShadow:
                "0 4px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.08)",
            }}
          >
            {label}
          </div>,
          document.body,
        )}
    </>
  );
};

const MyAsyncMultiSelect = <Option, Group extends GroupBase<Option>, T extends FieldValues = FieldValues>({
  errMsg,
  name,
  label,
  loadOptions,
  setValue,
  labelAsValue,
  onChange,
  defaultOptions,
  defaultValue,
  value,
  className,
  placeholder
}: InputProps<Option, Group, T>) => {

  const customStyles = useSelectStyles(errMsg, { minHeight: "48px", rtl: true });

  return (
    <div className={`flex flex-col gap-2 ${className || ""}`}>
      <label
        htmlFor={name}
        className="text-sm font-medium text-fg-muted text-right"
      >
        {label}
      </label>

      <div className="relative">
        <AsyncSelect
          isMulti
          cacheOptions
          defaultValue={defaultValue}
          value={value}
          loadOptions={loadOptions}
          defaultOptions={defaultOptions}
          onChange={(newVal) => {
            const values = (newVal as ReactSelectOption[]).map((val) =>
              labelAsValue ? val.label : val.value
            );
            if (onChange) {
              onChange(values as string[]);
            } else {
              setValue(name, values as unknown as PathValue<T, Path<T>>);
            }
          }}
          name={name}
          placeholder={placeholder || `${label} را انتخاب کنید`}
          styles={customStyles}
          noOptionsMessage={() => "گزینه‌یافت نشد"}
          loadingMessage={() => "در حال بارگذاری..."}
          isRtl={true}
          className="react-select-container"
          classNamePrefix="react-select"
          components={{
            MultiValue: (props) => (
              <MultiValueWithTooltip
                {...props}
                data={props.data as SelectOption}
              />
            ),
          }}
        />
      </div>

      {errMsg && (
        <span className="text-rose-400 text-xs font-medium text-right mt-1 flex items-center gap-1">
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

export default MyAsyncMultiSelect;
