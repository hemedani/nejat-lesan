"use client";
import { ReactSelectOption } from "@/types/option";
import dynamic from "next/dynamic";
import React from "react";
import { FieldPath, FieldValues, Path, PathValue, UseFormSetValue } from "react-hook-form";
import { GroupBase, OptionsOrGroups, PropsValue, StylesConfig } from "react-select";

const AsyncSelect = dynamic(() => import("react-select/async"), { ssr: false });

export type SelectOption = { value: string; label: string };

interface InputProps<Option, Group extends GroupBase<Option>, T extends FieldValues = FieldValues> {
  name: FieldPath<T>;
  label: string;
  setValue: UseFormSetValue<T>;
  labelAsValue?: boolean;
  errMsg?: string;
  placeholder?: string;
  loadOptions?: (inputValue: string, callback: (options: OptionsOrGroups<Option, Group>) => void) => Promise<OptionsOrGroups<Option, Group>> | void;
  defaultOptions?: OptionsOrGroups<Option, Group> | boolean;
  defaultValue?: PropsValue<Option>;
  className?: string;
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
  className,
  placeholder
}: InputProps<Option, Group, T>) => {

  const customStyles: StylesConfig<unknown, true> = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '48px',
      backgroundColor: errMsg ? '#fef2f2' : 'white',
      borderColor: errMsg
        ? (state.isFocused ? '#ef4444' : '#fca5a5')
        : (state.isFocused ? '#3b82f6' : (state.menuIsOpen ? '#64748b' : '#cbd5e1')),
      borderWidth: '1px',
      borderRadius: '12px',
      boxShadow: state.isFocused
        ? (errMsg ? '0 0 0 2px rgba(239, 68, 68, 0.1)' : '0 0 0 2px rgba(59, 130, 246, 0.1)')
        : 'none',
      '&:hover': {
        borderColor: errMsg ? '#f87171' : '#64748b',
        backgroundColor: errMsg ? '#fef2f2' : '#f8fafc'
      },
      transition: 'all 0.2s ease-in-out',
      cursor: 'pointer',
      direction: 'rtl'
    }),

    valueContainer: (provided) => ({
      ...provided,
      padding: '2px 16px',
      direction: 'rtl'
    }),

    input: (provided) => ({
      ...provided,
      margin: '0',
      padding: '0',
      color: '#1e293b',
      direction: 'rtl'
    }),

    placeholder: (provided) => ({
      ...provided,
      color: '#94a3b8',
      fontSize: '14px',
      direction: 'rtl',
      textAlign: 'right'
    }),

    singleValue: (provided) => ({
      ...provided,
      color: '#1e293b',
      direction: 'rtl',
      textAlign: 'right'
    }),

    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#e2e8f0',
      borderRadius: '8px',
      margin: '2px',
      direction: 'rtl'
    }),

    multiValueLabel: (provided) => ({
      ...provided,
      color: '#475569',
      fontSize: '13px',
      fontWeight: '500',
      padding: '4px 8px',
      direction: 'rtl'
    }),

    multiValueRemove: (provided) => ({
      ...provided,
      color: '#64748b',
      borderRadius: '0 8px 8px 0',
      '&:hover': {
        backgroundColor: '#ef4444',
        color: 'white'
      },
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out'
    }),

    indicatorSeparator: () => ({
      display: 'none'
    }),

    dropdownIndicator: (provided, state) => ({
      ...provided,
      color: '#64748b',
      padding: '8px 12px',
      '&:hover': {
        color: '#3b82f6'
      },
      transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'all 0.2s ease-in-out'
    }),

    clearIndicator: (provided) => ({
      ...provided,
      color: '#64748b',
      padding: '8px',
      '&:hover': {
        color: '#ef4444'
      },
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out'
    }),

    menu: (provided) => ({
      ...provided,
      backgroundColor: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      marginTop: '4px',
      overflow: 'hidden',
      zIndex: 9999
    }),

    menuList: (provided) => ({
      ...provided,
      padding: '8px',
      maxHeight: '200px'
    }),

    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#3b82f6'
        : (state.isFocused ? '#f1f5f9' : 'transparent'),
      color: state.isSelected ? 'white' : '#1e293b',
      borderRadius: '8px',
      margin: '2px 0',
      padding: '12px 16px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: state.isSelected ? '500' : '400',
      direction: 'rtl',
      textAlign: 'right',
      '&:hover': {
        backgroundColor: state.isSelected ? '#2563eb' : '#f1f5f9'
      },
      transition: 'all 0.15s ease-in-out'
    }),

    noOptionsMessage: (provided) => ({
      ...provided,
      color: '#64748b',
      fontSize: '14px',
      padding: '12px 16px',
      direction: 'rtl',
      textAlign: 'right'
    }),

    loadingMessage: (provided) => ({
      ...provided,
      color: '#64748b',
      fontSize: '14px',
      padding: '12px 16px',
      direction: 'rtl',
      textAlign: 'right'
    })
  };

  return (
    <div className={`flex flex-col gap-2 ${className || ""}`}>
      <label
        htmlFor={name}
        className="text-sm font-medium text-slate-700 text-right"
      >
        {label}
      </label>

      <div className="relative">
        <AsyncSelect
          isMulti
          cacheOptions
          defaultValue={defaultValue}
          loadOptions={loadOptions}
          defaultOptions={defaultOptions}
          onChange={(newVal) =>
            setValue(
              name,
              ((newVal as ReactSelectOption[]).map((val) =>
                labelAsValue ? val.label : val.value
              ) as unknown as PathValue<T, Path<T>>)
            )
          }
          name={name}
          placeholder={placeholder || `${label} را انتخاب کنید`}
          styles={customStyles}
          noOptionsMessage={() => "گزینه‌ای یافت نشد"}
          loadingMessage={() => "در حال بارگذاری..."}
          isRtl={true}
          className="react-select-container"
          classNamePrefix="react-select"
        />
      </div>

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

export default MyAsyncMultiSelect;
