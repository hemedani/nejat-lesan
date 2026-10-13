"use client";

import dynamic from "next/dynamic";

/**
 * `react-select/async` پشت `dynamic(..., { ssr: false })` تایپش را از دست
 * می‌دهد و هر فرمی که از آن استفاده کند ناچار `as any` می‌نویسد — همان چیزی
 * که `FormCreateCity` و هم‌خانواده‌هایش را وادار کرده کل فایل را با
 * `eslint-disable` بگذرانند.
 *
 * این پوشش تایپ را نگه می‌دارد: ژنریک‌ها تا `AsyncSelect` می‌رسند و مصرف‌کننده
 * بدون cast تایپ می‌شود. کنترل‌شده است (نه RHF) تا بشود در فرم‌های
 * `useState` هم استفاده‌اش کرد.
 */
const AsyncSelect = dynamic(() => import("react-select/async"), { ssr: false });

export type RefOption = { value: string; label: string };

const STYLES = {
  control: (base: Record<string, unknown>) => ({
    ...base,
    backgroundColor: "rgba(255,255,255,.04)",
    borderColor: "rgba(255,255,255,.1)",
    color: "#fff",
  }),
  menu: (base: Record<string, unknown>) => ({ ...base, backgroundColor: "#0f172a" }),
  option: (
    base: Record<string, unknown>,
    state: { isSelected: boolean; isFocused: boolean },
  ) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#1d4ed8"
      : state.isFocused
        ? "#1e293b"
        : "transparent",
    color: "#fff",
    direction: "rtl",
    textAlign: "right",
  }),
  multiValue: (base: Record<string, unknown>) => ({
    ...base,
    backgroundColor: "#1e3a8a",
  }),
  multiValueLabel: (base: Record<string, unknown>) => ({
    ...base,
    color: "#fff",
  }),
  input: (base: Record<string, unknown>) => ({ ...base, color: "#fff" }),
  placeholder: (base: Record<string, unknown>) => ({
    ...base,
    color: "#64748b",
  }),
} as never;

type BaseProps = {
  /** شناسه‌ی یکتا — `react-select` برای چند نمونه روی یک صفحه لازمش دارد. */
  instanceId: string;
  label: string;
  /** گزینه‌های از پیش‌بارگذاری‌شده. */
  options: RefOption[];
  /** فیلتر سمت کلاینت روی `options`؛ برای فهرست‌های کوچک کافی است. */
  onFilter?: (input: string) => RefOption[];
  placeholder?: string;
  errorMessage?: string;
  /** فیلد غیرقابل‌تغییر (مثل راهِ سازمان که یک‌بار تعیین می‌شود). */
  disabled?: boolean;
};

type SingleProps = BaseProps & {
  multiple?: false;
  value: RefOption | null;
  onChange: (value: RefOption | null) => void;
};

type MultiProps = BaseProps & {
  multiple: true;
  value: RefOption[];
  onChange: (value: RefOption[]) => void;
};

export type RefSelectProps = SingleProps | MultiProps;

export function RefSelect(props: RefSelectProps) {
  const {
    instanceId,
    label,
    options,
    onFilter,
    placeholder,
    errorMessage,
    value,
    onChange,
    multiple,
    disabled,
  } = props;

  const loadOptions = (input: string) =>
    onFilter ? onFilter(input) : options;

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-300">{label}</label>
      <AsyncSelect
        cacheOptions
        defaultOptions
        instanceId={instanceId}
        isClearable={!multiple && !disabled}
        isDisabled={disabled}
        isMulti={multiple}
        loadOptions={async (input: string) => loadOptions(input)}
        onChange={(opt) => {
          if (multiple) {
            onChange((opt as RefOption[] | null) ?? []);
          } else {
            onChange((opt as RefOption | null) ?? null);
          }
        }}
        options={options}
        placeholder={placeholder}
        styles={STYLES}
        value={value}
      />
      {errorMessage && (
        <p className="text-xs font-medium text-rose-400">{errorMessage}</p>
      )}
    </div>
  );
}

export default RefSelect;
