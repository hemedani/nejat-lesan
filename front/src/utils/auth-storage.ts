"use client";

import Cookies from "js-cookie";
import {
  AUTH_COOKIE,
  AUTH_MAX_AGE_DAYS,
  AUTH_MODULE_FEED_KEY,
  AUTH_SCHEMA_KEY,
  AUTH_SCHEMA_VERSION,
  AUTH_USER_KEY,
  LEGACY_AUTH_COOKIE,
} from "@/utils/auth-constants";
import type { ModuleFeed, UserData } from "@/types/auth";

const isBrowser = () => typeof window !== "undefined";

const cookieOptions = () => ({
  path: "/",
  expires: AUTH_MAX_AGE_DAYS,
  sameSite: "lax" as const,
  secure: window.location.protocol === "https:",
});

export const getAuthToken = (): string | undefined =>
  isBrowser() ? Cookies.get(AUTH_COOKIE) : undefined;

export const setAuthToken = (token: string): void => {
  if (!isBrowser()) return;
  Cookies.set(AUTH_COOKIE, token, cookieOptions());
};

export const clearAuthToken = (): void => {
  if (!isBrowser()) return;
  Cookies.remove(AUTH_COOKIE, { path: "/" });
};

export const readCachedUser = (): UserData | null => {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserData;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

export const writeCachedUser = (user: UserData): void => {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch {
    return;
  }
};

export const clearCachedUser = (): void => {
  if (!isBrowser()) return;
  localStorage.removeItem(AUTH_USER_KEY);
};

export const readCachedModuleFeed = (): ModuleFeed | null => {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(AUTH_MODULE_FEED_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ModuleFeed;
    return typeof parsed?.modules === "undefined" &&
      typeof parsed?.orgModules === "undefined"
      ? null
      : parsed;
  } catch {
    return null;
  }
};

export const writeCachedModuleFeed = (feed?: ModuleFeed | null): void => {
  if (!isBrowser() || !feed) return;
  if (!feed.modules && !feed.orgModules) return;
  try {
    localStorage.setItem(AUTH_MODULE_FEED_KEY, JSON.stringify(feed));
  } catch {
    return;
  }
};

export const clearCachedModuleFeed = (): void => {
  if (!isBrowser()) return;
  localStorage.removeItem(AUTH_MODULE_FEED_KEY);
};

export const clearCachedSession = (): void => {
  clearCachedUser();
  clearCachedModuleFeed();
};

export const purgeLegacyAuthArtifacts = (): void => {
  if (!isBrowser()) return;
  try {
    if (localStorage.getItem(AUTH_SCHEMA_KEY) === AUTH_SCHEMA_VERSION) return;

    const legacyToken = Cookies.get(LEGACY_AUTH_COOKIE);
    if (!Cookies.get(AUTH_COOKIE) && legacyToken) {
      Cookies.set(AUTH_COOKIE, legacyToken, cookieOptions());
    }
    Cookies.remove(LEGACY_AUTH_COOKIE, { path: "/" });
    localStorage.removeItem(LEGACY_AUTH_COOKIE);
    sessionStorage.removeItem(LEGACY_AUTH_COOKIE);

    const legacyFeed = sessionStorage.getItem(AUTH_MODULE_FEED_KEY);
    if (legacyFeed && !localStorage.getItem(AUTH_MODULE_FEED_KEY)) {
      localStorage.setItem(AUTH_MODULE_FEED_KEY, legacyFeed);
    }
    sessionStorage.removeItem(AUTH_MODULE_FEED_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);

    localStorage.setItem(AUTH_SCHEMA_KEY, AUTH_SCHEMA_VERSION);
  } catch {
    return;
  }
};
