"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import {
    applyTheme,
    DEFAULT_THEME_PREFERENCE,
    readThemePreference,
    resolveTheme,
    writeThemePreference,
    type ResolvedTheme,
    type ThemePreference,
} from "@/utils/theme";

interface ThemeContextValue {
    /** What the user chose — may be `system`. */
    preference: ThemePreference;
    /** What is painted right now — never `system`. */
    resolved: ResolvedTheme;
    setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Owns the single theme axis.
 *
 * Two rules keep this free of flash and of hydration mismatches:
 *
 * 1. The server renders `data-theme="dark"` and the pre-paint script in
 *    `app/layout.tsx` corrects it before the first frame. This provider never
 *    paints a theme — it only keeps React state in step with what the DOM
 *    already shows.
 * 2. Anything that needs a *colour* (ApexCharts, Leaflet) reads the DOM
 *    attribute, not `resolved` — see `utils/chart-theme.ts`. React state is for
 *    UI (the toggle's active segment), never for painting.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
    const [preference, setPreferenceState] = useState<ThemePreference>(DEFAULT_THEME_PREFERENCE);
    const [systemPrefersDark, setSystemPrefersDark] = useState(false);

    // Sync from the cookie after mount. The DOM is already correct by now, so
    // this cannot cause a repaint.
    useEffect(() => {
        setPreferenceState(readThemePreference());

        const media = window.matchMedia("(prefers-color-scheme: dark)");
        setSystemPrefersDark(media.matches);
        const onSystemChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
        media.addEventListener("change", onSystemChange);
        return () => media.removeEventListener("change", onSystemChange);
    }, []);

    const resolved = resolveTheme(preference, systemPrefersDark);

    useEffect(() => {
        applyTheme(resolved);
    }, [resolved]);

    // Cookies do not emit `storage` events, so another tab cannot be notified.
    // Re-reading on focus covers the case that actually happens: switching back
    // to a tab that was left open while the theme was changed elsewhere.
    useEffect(() => {
        const sync = () => setPreferenceState(readThemePreference());
        window.addEventListener("focus", sync);
        document.addEventListener("visibilitychange", sync);
        return () => {
            window.removeEventListener("focus", sync);
            document.removeEventListener("visibilitychange", sync);
        };
    }, []);

    const setPreference = useCallback((next: ThemePreference) => {
        writeThemePreference(next);
        setPreferenceState(next);
    }, []);

    const value = useMemo<ThemeContextValue>(
        () => ({ preference, resolved, setPreference }),
        [preference, resolved, setPreference],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
