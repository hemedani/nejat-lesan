"use client";

import React from "react";

type ButtonVariant = "primary" | "secondary" | "neutral" | "danger" | "warning";
type ButtonSize = "sm" | "md";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

/**
 * Project-standard button.
 * Variants mirror the admin-panel patterns:
 * primary   -> blue-600 with glow (e.g. "+ ایجاد" buttons)
 * secondary -> white/[.06] bordered (e.g. hero secondary actions)
 * neutral   -> slate-800 bordered (e.g. modal cancel)
 * danger    -> rose tinted destructive
 * warning   -> orange tinted cautionary action
 */
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-on-brand font-semibold shadow-[0_0_20px_rgba(37,99,235,.18)] hover:bg-brand-hover",
  secondary: "border border-line-strong bg-surface-hover text-fg hover:bg-surface-hover",
  neutral: "border border-line bg-surface-sunken text-fg hover:bg-surface-hover",
  danger: "tint-rose border border-tint-border text-tint-fg hover:bg-tint-soft",
  warning: "tint-orange border border-tint-border bg-tint-soft text-tint-fg hover:bg-tint-soft",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-xs",
  md: "px-4 py-2.5 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  className = "",
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand/50 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}

export default Button;
