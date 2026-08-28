"use client";
import React from "react";
import Select, { PropsValue } from "react-select";
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

const SelectBox = <T extends FieldValues = FieldValues>(
  props: SelectBoxProps<T>,
) => {
  const { options, placeholder = "انتخاب کنید", className = "", errMsg } = props;
  const id = props.name || props.label;

  const selectedOption =
    "value" in props
      ? options.find((option) => option.value === props.value) ?? null
      : null;

  return (
    <div
      className={
        "setValue" in props
          ? `w-1/2 p-4 flex flex-col gap-1 ${className}`
          : `flex flex-col gap-2 ${className}`
      }
    >
      {props.label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {props.label}
        </label>
      )}
      <Select
        id={id}
        options={options}
        value={"value" in props ? selectedOption : undefined}
        defaultValue={"defaultValue" in props ? props.defaultValue : undefined}
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
        isClearable={!("setValue" in props)}
        placeholder={placeholder}
        noOptionsMessage={() => "گزینه‌ای یافت نشد"}
        classNamePrefix="react-select"
        className={`text-sm ${errMsg ? "border-red-500" : "border-gray-300"}`}
      />
      {errMsg && (
        <span className="text-red-500 text-xs">{errMsg}</span>
      )}
    </div>
  );
};

export default SelectBox;
