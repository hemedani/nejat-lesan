"use client";
import React from "react";
import Select, { GroupBase, OptionsOrGroups, PropsValue } from "react-select";
import {
  FieldValues,
  FieldPath,
  UseFormSetValue,
  PathValue,
  Path,
} from "react-hook-form";
import { ReactSelectOption } from "@/types/option";

interface SelectBoxProps<Option, Group extends GroupBase<Option>, T extends FieldValues = FieldValues> {
  name: FieldPath<T>;
  label: string;
  setValue: UseFormSetValue<T>;
  options: ReactSelectOption[];
  placeholder?: string;
  labelAsValue?: boolean;
  className?: string;
  errMsg?: string
  defaultValue?: PropsValue<ReactSelectOption>;
  defaultOptions?: OptionsOrGroups<Option, Group> | boolean;
}

const SelectBox = <Option, Group extends GroupBase<Option>, T extends FieldValues = FieldValues>({
  name,
  setValue,
  label,
  options,
  errMsg,
  placeholder = "انتخاب کنید",
  className = "",
  labelAsValue,
  defaultValue
}: SelectBoxProps<Option, Group, T>) => {

  return (
    <div className={`w-1/2 p-4 flex flex-col gap-1 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <Select
        id={name}
        options={options}
        onChange={(newVal) => setValue(name, (labelAsValue ? newVal!.label : newVal!.value) as unknown as PathValue<T, Path<T>>)}
        placeholder={placeholder}
        classNamePrefix="react-select"
        className={`text-sm ${errMsg ? "border-red-500" : "border-gray-300"
          }`}
        defaultValue={defaultValue}
      />
      {errMsg && (
        <span className="text-red-500 text-xs">{errMsg}</span>
      )}
    </div>
  );
};

export default SelectBox;
