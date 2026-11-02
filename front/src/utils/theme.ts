import Cookies from "js-cookie";

/**
 * Theme primitives — one axis for the whole app.
 *
 * Design: `docs/superpowers/specs/2026-11-01-theme-architecture-design.md`
 *
 * The theme is a property of the **document**, not of a route or a wrapper
 * component. It lives on `<html data-theme>`; CSS variables do the rest. Nothing
 * here knows which page it is rendering.
 */

export const THEME_COOKIE = "lesan-theme";
const THEME_COOKIE_MAX_AGE_DAYS = 365;

/** What the user chose. `system` defers to the OS. */
export type ThemePreference = "light" | "dark" | "system";

/** What is actually painted. Never `system`. */
export type ResolvedTheme = "light" | "dark";

/**
 * The product is dark-native: navbar, login, landing, every panel and the form
 * builder were designed dark, and they define the product's identity. Defaulting
 * to `dark` (rather than `system`) means a machine whose OS is light still gets
 * the intended UI. `system` stays available as a user choice.
 */
export const DEFAULT_THEME_PREFERENCE: ThemePreference = "dark";

/**
 * Ships the switch in the navbar.
 *
 * Enabled in Phase 3, once both the panels and the analytics surfaces read from
 * tokens. Flipping this back to `false` hides the control without changing any
 * behaviour — the persisted cookie and the `data-theme` attribute keep working,
 * so a user who already chose light stays on light.
 */
export const THEME_TOGGLE_ENABLED = true;

export const THEME_PREFERENCE_LABELS: Record<ThemePreference, string> = {
    light: "روشن",
    dark: "تاریک",
    system: "سیستم",
};

const PREFERENCES: readonly ThemePreference[] = ["light", "dark", "system"];

export function isThemePreference(value: unknown): value is ThemePreference {
    return typeof value === "string" && (PREFERENCES as readonly string[]).includes(value);
}

export function resolveTheme(
    preference: ThemePreference,
    systemPrefersDark: boolean,
): ResolvedTheme {
    if (preference === "system") return systemPrefersDark ? "dark" : "light";
    return preference;
}

/**
 * Reads the persisted preference. Returns the default when the cookie is absent
 * or holds a value this version does not recognise — a stale cookie must not
 * leave the app themeless.
 */
export function readThemePreference(): ThemePreference {
    const stored = Cookies.get(THEME_COOKIE);
    return isThemePreference(stored) ? stored : DEFAULT_THEME_PREFERENCE;
}

export function writeThemePreference(preference: ThemePreference): void {
    Cookies.set(THEME_COOKIE, preference, {
        path: "/",
        expires: THEME_COOKIE_MAX_AGE_DAYS,
        sameSite: "lax",
    });
}

/**
 * Applies the resolved theme to the document.
 *
 * `color-scheme` is set alongside `data-theme` so native scrollbars, form
 * controls, focus rings and the text caret follow without any extra CSS.
 */
export function applyTheme(theme: ResolvedTheme): void {
    const root = document.documentElement;
    root.style.colorScheme = theme;
    if (root.getAttribute("data-theme") !== theme) {
        root.setAttribute("data-theme", theme);
    }
}

export function readAppliedTheme(): ResolvedTheme {
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

/**
 * Blocking script injected into `<head>` before any paint.
 *
 * Without it the first frame renders with the server default and then flips,
 * which is the classic flash-of-wrong-theme. It is inline and dependency-free on
 * purpose: it must finish before the parser reaches `<body>`.
 *
 * Any failure falls through silently — the server already wrote a valid
 * `data-theme`, so the worst case is the default theme, never an unstyled page.
 */
export const THEME_INIT_SCRIPT = `(function(){try{
var m=document.cookie.match(/(?:^|;\\s*)${THEME_COOKIE}=(light|dark|system)/);
var p=m?m[1]:'${DEFAULT_THEME_PREFERENCE}';
var d=p==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;
var e=document.documentElement;
e.setAttribute('data-theme',d);
e.style.colorScheme=d;
}catch(_){}})();`;
