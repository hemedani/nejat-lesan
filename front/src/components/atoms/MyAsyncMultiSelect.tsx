"use client";
import { ReactSelectOption } from "@/types/option";
import dynamic from "next/dynamic";
import React from "react";
import { FieldPath, FieldValues, Path, PathValue, UseFormSetValue, } from "react-hook-form";
import { GroupBase, OptionsOrGroups, PropsValue } from "react-select";

const AsyncSelect = dynamic(() => import("react-select/async"), { ssr: false });

export type SelectOption = { value: string, label: string }

interface InputProps<Option, Group extends GroupBase<Option>, T extends FieldValues = FieldValues> {
  name: FieldPath<T>;
  label: string;
  setValue: UseFormSetValue<T>;
  labelAsValue?: boolean;
  errMsg?: string
  placeholder?: string
  loadOptions?: (inputValue: string, callback: (options: OptionsOrGroups<Option, Group>) => void) => Promise<OptionsOrGroups<Option, Group>> | void;
  defaultOptions?: OptionsOrGroups<Option, Group> | boolean;
  defaultValue?: PropsValue<Option>;
  className?: string

}

const MyAsyncMultiSelect = <Option, Group extends GroupBase<Option>, T extends FieldValues = FieldValues>({
  errMsg,
  name,
  label,
  loadOptions,
  setValue,
  labelAsValue,
  defaultOptions,
  defaultValue,
  className
}: InputProps<Option, Group, T>) => {

  return (
    <div className={`w-1/2 p-4 flex flex-col gap-2 ${className ? className : ""}`}>
      <label htmlFor="tags" className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <AsyncSelect
        isMulti
        cacheOptions
        defaultValue={defaultValue}
        loadOptions={loadOptions}
        defaultOptions={defaultOptions}
        onChange={(newVal) => setValue(name, ((newVal as ReactSelectOption[]).map(val => labelAsValue ? val.label : val.value) as unknown as PathValue<T, Path<T>>))}
        name={name}
        placeholder={`${label} را انتخاب کنید`}
        classNamePrefix="react-select"
      />
      {errMsg && (
        <span className="text-red-500 text-xs">
          {errMsg}
        </span>
      )}
    </div>
  );
};

export default MyAsyncMultiSelect;
