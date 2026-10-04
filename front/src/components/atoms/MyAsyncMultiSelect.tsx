"use client";
import { ReactSelectOption } from "@/types/option";
import dynamic from "next/dynamic";
import React, { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { FieldPath, FieldValues, Path, PathValue, UseFormSetValue } from "react-hook-form";
import { components as defaultComponents, GroupBase, MultiValueProps, OptionsOrGroups, PropsValue, StylesConfig } from "react-select";

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
                background: "#1e293b",
              color: "#f1f5f9",
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

  const customStyles: StylesConfig<unknown, true> = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '48px',
      backgroundColor: errMsg ? 'rgba(251, 113, 133, 0.10)' : 'rgba(255, 255, 255, 0.04)',
      borderColor: errMsg
        ? (state.isFocused ? '#fb7185' : 'rgba(251, 113, 133, 0.50)')
        : (state.isFocused ? 'rgba(96, 165, 250, 0.65)' : (state.menuIsOpen ? '#64748b' : 'rgba(255, 255, 255, 0.10)')),
      borderWidth: '1px',
      borderRadius: '12px',
      boxShadow: state.isFocused
        ? (errMsg ? '0 0 0 2px rgba(251, 113, 133, 0.10)' : '0 0 0 2px rgba(59, 130, 246, 0.14)')
        : 'none',
      '&:hover': {
        borderColor: errMsg ? '#fb7185' : 'rgba(255, 255, 255, 0.20)',
        backgroundColor: errMsg ? 'rgba(251, 113, 133, 0.14)' : 'rgba(255, 255, 255, 0.06)'
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
      color: '#e2e8f0',
      direction: 'rtl'
    }),

    placeholder: (provided) => ({
      ...provided,
      color: '#64748b',
      fontSize: '14px',
      direction: 'rtl',
      textAlign: 'right'
    }),

    singleValue: (provided) => ({
      ...provided,
      color: '#e2e8f0',
      direction: 'rtl',
      textAlign: 'right'
    }),

    multiValue: (provided) => ({
      ...provided,
      backgroundColor: 'rgba(96, 165, 250, 0.14)',
      border: '1px solid rgba(96, 165, 250, 0.30)',
      borderRadius: '8px',
      margin: '2px',
      direction: 'rtl'
    }),

    multiValueLabel: (provided) => ({
      ...provided,
      color: '#bfdbfe',
      fontSize: '13px',
      fontWeight: '500',
      padding: '4px 8px',
      direction: 'rtl'
    }),

    multiValueRemove: (provided) => ({
      ...provided,
      color: '#94a3b8',
      borderRadius: '0 8px 8px 0',
      '&:hover': {
        backgroundColor: '#fb7185',
        color: '#0f172a'
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
        color: '#60a5fa'
      },
      transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'all 0.2s ease-in-out'
    }),

    clearIndicator: (provided) => ({
      ...provided,
      color: '#64748b',
      padding: '8px',
      '&:hover': {
        color: '#fb7185'
      },
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out'
    }),

    menu: (provided) => ({
      ...provided,
      backgroundColor: '#0f172a',
      border: '1px solid rgba(255, 255, 255, 0.10)',
      borderRadius: '12px',
      boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.5)',
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
        ? 'rgba(37, 99, 235, 0.35)'
        : (state.isFocused ? 'rgba(59, 130, 246, 0.14)' : 'transparent'),
      color: state.isSelected ? '#dbeafe' : '#cbd5e1',
      borderRadius: '8px',
      margin: '2px 0',
      padding: '12px 16px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: state.isSelected ? '500' : '400',
      direction: 'rtl',
      textAlign: 'right',
      '&:hover': {
        backgroundColor: state.isSelected ? 'rgba(37, 99, 235, 0.45)' : 'rgba(59, 130, 246, 0.14)'
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
        className="text-sm font-medium text-slate-300 text-right"
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
