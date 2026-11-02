"use client";
import React, { useEffect, useState } from "react";
import Select, { PropsValue, StylesConfig } from "react-select";
import {
  FieldValues,
  FieldPath,
  UseFormSetValue,
  PathValue,
  Path,
} from "react-hook-form";
import { ReactSelectOption } from "@/types/option";
import { useSelectStyles } from "@/utils/select-styles";

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

const SelectBox = <T extends FieldValues = FieldValues>(
  props: SelectBoxProps<T>,
) => {
  const { options, placeholder = "انتخاب کنید", className = "", errMsg, disabled = false, clearable } = props;
  const id = props.name || props.label;
  const styles = useSelectStyles(errMsg);

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
        <label htmlFor={id} className="text-sm font-medium text-fg-muted">
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
