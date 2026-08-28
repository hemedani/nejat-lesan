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
    "bg-blue-600 text-white font-semibold shadow-[0_0_20px_rgba(37,99,235,.18)] hover:bg-blue-500",
  secondary: "border border-white/15 bg-white/[.06] text-slate-200 hover:bg-white/10",
  neutral: "border border-white/10 bg-slate-800 text-slate-200 hover:bg-slate-700",
  danger: "border border-rose-400/20 text-rose-200 hover:bg-rose-400/10",
  warning: "border border-orange-400/30 bg-orange-400/10 text-orange-100 hover:bg-orange-400/20",
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
      className={`inline-flex items-center justify-center gap-2 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
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
