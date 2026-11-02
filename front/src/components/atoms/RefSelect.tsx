"use client";

import dynamic from "next/dynamic";
import { useSelectStyles } from "@/utils/select-styles";

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

  const styles = useSelectStyles(errorMessage);

  const loadOptions = (input: string) =>
    onFilter ? onFilter(input) : options;

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-fg-muted">{label}</label>
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
        styles={styles}
        value={value}
      />
      {errorMessage && (
        <p className="text-xs font-medium text-rose-400">{errorMessage}</p>
      )}
    </div>
  );
}

export default RefSelect;
