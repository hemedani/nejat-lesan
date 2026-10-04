"use client";
import React, { useEffect, useMemo, useState } from "react";
import Select, { PropsValue, StylesConfig } from "react-select";
import {
  FieldValues,
  FieldPath,
  UseFormSetValue,
  PathValue,
  Path,
} from "react-hook-form";
import { ReactSelectOption } from "@/types/option";

interface CommonSelectProps {
  label?: string;
  options: ReactSelectOption[];
  placeholder?: string;
  className?: string;
  errMsg?: string;
  disabled?: boolean;
  clearable?: boolean;
}

/** react-hook-form mode */
interface RhfSelectProps<T extends FieldValues = FieldValues>
  extends CommonSelectProps {
  name: FieldPath<T>;
  setValue: UseFormSetValue<T>;
  labelAsValue?: boolean;
  defaultValue?: PropsValue<ReactSelectOption>;
}

/** plain controlled mode (filters & simple forms) */
interface ControlledSelectProps extends CommonSelectProps {
  name?: string;
  value: string;
  onValueChange: (value: string) => void;
}

export type SelectBoxProps<T extends FieldValues = FieldValues> =
  | RhfSelectProps<T>
  | ControlledSelectProps;

type Option = ReactSelectOption;

/**
 * react-select renders its own DOM, so the dark theme has to be handed to it
 * as inline `styles` — the global stylesheet cannot reach these nodes by class
 * name alone. Colours mirror the @theme tokens in globals.css.
 */
const darkStyles = (errMsg?: string): StylesConfig<Option, false> => ({
  control: (provided, state) => ({
    ...provided,
    minHeight: "44px",
    backgroundColor: errMsg
      ? "rgba(251, 113, 133, 0.10)"
      : "rgba(255, 255, 255, 0.04)",
    borderColor: errMsg
      ? "rgba(251, 113, 133, 0.50)"
      : state.isFocused
        ? "rgba(96, 165, 250, 0.65)"
        : "rgba(255, 255, 255, 0.10)",
    borderRadius: "12px",
    boxShadow: "none",
    "&:hover": { borderColor: errMsg ? "#fb7185" : "rgba(255,255,255,.20)" },
  }),
  valueContainer: (provided) => ({ ...provided, padding: "2px 12px" }),
  input: (provided) => ({ ...provided, color: "#e2e8f0" }),
  placeholder: (provided) => ({ ...provided, color: "#64748b" }),
  singleValue: (provided) => ({ ...provided, color: "#e2e8f0" }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: "#64748b",
    padding: "6px 10px",
    "&:hover": { color: "#60a5fa" },
  }),
  clearIndicator: (provided) => ({
    ...provided,
    color: "#64748b",
    padding: "6px",
    "&:hover": { color: "#fb7185" },
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: "#0f172a",
    border: "1px solid rgba(255,255,255,.10)",
    borderRadius: "12px",
    boxShadow: "0 20px 40px -12px rgba(0,0,0,.5)",
    marginTop: "4px",
    zIndex: 9999,
  }),
  menuList: (provided) => ({ ...provided, padding: "6px", maxHeight: "240px" }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "rgba(37, 99, 235, 0.35)"
      : state.isFocused
        ? "rgba(59, 130, 246, 0.14)"
        : "transparent",
    color: state.isSelected ? "#dbeafe" : "#cbd5e1",
    borderRadius: "8px",
    cursor: "pointer",
  }),
  noOptionsMessage: (provided) => ({ ...provided, color: "#64748b" }),
});

const SelectBox = <T extends FieldValues = FieldValues>(
  props: SelectBoxProps<T>,
) => {
  const { options, placeholder = "انتخاب کنید", className = "", errMsg, disabled = false, clearable } = props;
  const id = props.name || props.label;
  const styles = useMemo(() => darkStyles(errMsg), [errMsg]);

  // react-select renders an aria-live region on the server; render it only after
  // mount to avoid React hydration mismatches (SSR) on pages that use SelectBox.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedOption =
    "value" in props
      ? options.find((option) => option.value === props.value) ?? null
      : null;

  const isClearable = clearable ?? !("setValue" in props);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {props.label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-300">
          {props.label}
        </label>
      )}
      {mounted ? (
        <Select
          id={id}
          options={options}
          value={"value" in props ? selectedOption : undefined}
          defaultValue={"defaultValue" in props ? props.defaultValue : undefined}
          isDisabled={disabled}
          isClearable={isClearable}
          onChange={(newVal) => {
            if ("setValue" in props) {
              if (!newVal) return;
              props.setValue(
                props.name,
                (props.labelAsValue ? newVal.label : newVal.value) as unknown as PathValue<
                  T,
                  Path<T>
                >,
              );
            } else {
              props.onValueChange(newVal ? String(newVal.value) : "");
            }
          }}
          placeholder={placeholder}
          noOptionsMessage={() => "گزینه‌ای یافت نشد"}
          isRtl
          styles={styles}
          className="text-sm"
        />
      ) : (
        <div aria-hidden className="min-h-[44px]" />
      )}
      {errMsg && (
        <span className="text-xs font-medium text-rose-400">{errMsg}</span>
      )}
    </div>
  );
};

export default SelectBox;
