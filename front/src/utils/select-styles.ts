"use client";

import { useMemo } from "react";
import type { GroupBase, StylesConfig } from "react-select";
import { usePalette, type Palette } from "@/utils/use-theme-palette";

/**
 * react-select theming.
 *
 * The library builds its control, menu and options from an inline `styles` prop.
 * Those nodes are not addressable by class for the parts that matter, and the
 * inline object wins over any stylesheet — which is why `globals.css` used to
 * carry a `.admin-shell .react-select__*` block, and why every form had its own
 * copy of a hardcoded dark palette.
 *
 * One factory, driven by the shared palette. Light and dark both fall out of it.
 *
 * Design: docs/superpowers/specs/2026-11-01-theme-architecture-design.md
 */

export interface SelectStyleOptions {
    /** Control height. Defaults to 44px. */
    minHeight?: string;
    /** Force RTL on the control, option and value rows. */
    rtl?: boolean;
}

export function buildSelectStyles<T, IsMulti extends boolean = false>(
    palette: Palette,
    invalid?: string | boolean,
    options: SelectStyleOptions = {},
): StylesConfig<T, IsMulti, GroupBase<T>> {
    const hasError = Boolean(invalid);
    const controlBg = hasError ? palette["danger-soft"] : palette["surface-sunken"];
    const controlBorder = hasError ? palette["danger-border"] : palette.line;
    const rtl = options.rtl ? ({ direction: "rtl" } as const) : {};

    return {
        control: (provided, state) => ({
            ...provided,
            minHeight: options.minHeight ?? "44px",
            backgroundColor: controlBg,
            borderColor: hasError
                ? controlBorder
                : state.isFocused
                    ? palette["line-focus"]
                    : controlBorder,
            borderRadius: "12px",
            boxShadow: "none",
            ...rtl,
            "&:hover": {
                borderColor: hasError ? palette.danger : palette["line-strong"],
            },
        }),
        valueContainer: (provided) => ({ ...provided, padding: "2px 12px" }),
        input: (provided) => ({ ...provided, color: palette.fg }),
        placeholder: (provided) => ({ ...provided, color: palette["fg-faint"] }),
        singleValue: (provided) => ({ ...provided, color: palette.fg, ...rtl }),
        multiValue: (provided) => ({
            ...provided,
            backgroundColor: palette["brand-soft"],
            borderRadius: "8px",
        }),
        multiValueLabel: (provided) => ({ ...provided, color: palette["brand-fg"] }),
        multiValueRemove: (provided) => ({
            ...provided,
            color: palette["brand-fg"],
            ":hover": { backgroundColor: palette["brand-border"], color: palette.fg },
        }),
        indicatorSeparator: () => ({ display: "none" }),
        dropdownIndicator: (provided) => ({
            ...provided,
            color: palette["fg-faint"],
            padding: "6px 10px",
            "&:hover": { color: palette.brand },
        }),
        clearIndicator: (provided) => ({
            ...provided,
            color: palette["fg-faint"],
            padding: "6px",
            "&:hover": { color: palette.danger },
        }),
        menu: (provided) => ({
            ...provided,
            backgroundColor: palette["surface-raised"],
            border: `1px solid ${palette.line}`,
            borderRadius: "12px",
            boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.45)",
            marginTop: "4px",
            zIndex: 9999,
        }),
        menuList: (provided) => ({ ...provided, padding: "6px", maxHeight: "240px" }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected
                ? palette["brand-soft"]
                : state.isFocused
                    ? palette["surface-hover"]
                    : "transparent",
            color: state.isSelected ? palette["brand-fg"] : palette.fg,
            borderRadius: "8px",
            cursor: "pointer",
            ...(options.rtl ? { direction: "rtl" as const, textAlign: "right" as const } : {}),
            ":active": { backgroundColor: palette["brand-soft"] },
        }),
        noOptionsMessage: (provided) => ({ ...provided, color: palette["fg-faint"] }),
        loadingMessage: (provided) => ({ ...provided, color: palette["fg-faint"] }),
        groupHeading: (provided) => ({
            ...provided,
            color: palette["fg-faint"],
            fontSize: "11px",
            fontWeight: 500,
        }),
    };
}

/**
 * `const selectStyles = useSelectStyles(errMsg)` — memoised per theme and state.
 *
 * The return type is deliberately loose. `react-select`'s `styles` prop is
 * invariant in the option type, so pinning it to `<unknown, boolean>` here would
 * *widen* the component's own generic to `unknown` — and `onChange` with it,
 * breaking every handler that expects `{ value, label }`. A styled object is not
 * a place to enforce the option type; `loadOptions` already does that.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useSelectStyles(
    invalid?: string | boolean,
    options: SelectStyleOptions = {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): StylesConfig<any, any, any> {
    const palette = usePalette();
    return useMemo(
        () => buildSelectStyles(palette, invalid, options),
        // `options` is a literal at every call site; keying on its fields keeps
        // the memo stable without requiring the caller to memoise it.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [palette, invalid, options.minHeight, options.rtl],
    );
}
