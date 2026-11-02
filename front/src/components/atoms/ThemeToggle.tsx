"use client";

import { useTheme } from "@/context/ThemeContext";
import {
    THEME_PREFERENCE_LABELS,
    THEME_TOGGLE_ENABLED,
    type ThemePreference,
} from "@/utils/theme";

const ORDER: ThemePreference[] = ["light", "dark", "system"];

/**
 * Theme switch — a three-way segmented control, because "system" is a real
 * choice and a two-way toggle cannot express it.
 *
 * Renders nothing until `THEME_TOGGLE_ENABLED` is flipped in Phase 3 of the
 * theme migration. See `utils/theme.ts`.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
    const { preference, setPreference } = useTheme();

    if (!THEME_TOGGLE_ENABLED) return null;

    return (
        <div
            role="radiogroup"
            aria-label="پوسته"
            className={`inline-flex items-center gap-0.5 rounded-xl border border-line bg-surface-sunken p-0.5 ${className}`}
        >
            {ORDER.map((option) => {
                const active = preference === option;
                return (
                    <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        title={THEME_PREFERENCE_LABELS[option]}
                        onClick={() => setPreference(option)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                            active
                                ? "bg-brand-soft text-brand-fg"
                                : "text-fg-faint hover:bg-surface hover:text-fg-muted"
                        }`}
                    >
                        <ThemeIcon option={option} />
                    </button>
                );
            })}
        </div>
    );
}

function ThemeIcon({ option }: { option: ThemePreference }) {
    if (option === "light") {
        return (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M12 3v2m0 14v2m9-9h-2M5 12H3m14.95-6.95-1.41 1.41M7.46 16.54l-1.41 1.41m12.9 0-1.41-1.41M7.46 7.46 6.05 6.05M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
            </svg>
        );
    }
    if (option === "dark") {
        return (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"
                />
            </svg>
        );
    }
    return (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M9 4h6a2 2 0 012 2v10a2 2 0 01-2 2H9a2 2 0 01-2-2V6a2 2 0 012-2zM10 20h4"
            />
        </svg>
    );
}

export default ThemeToggle;
