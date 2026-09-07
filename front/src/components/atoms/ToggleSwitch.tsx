import React from "react";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * سوییچ استاندارد پروژه.
 * داخل track یک container با dir=ltr استفاده می‌شود تا جابه‌جایی گوی در RTL
 * دچار مشکل نشود؛ حالت روشن = گوی سمت راست، خاموش = سمت چپ (مستقل از جهت سند).
 */
const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      dir="ltr"
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-white/10 p-0.5 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
        checked ? "bg-blue-600" : "bg-gray-200"
      } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
    >
      <span
        aria-hidden
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
};

export default ToggleSwitch;
