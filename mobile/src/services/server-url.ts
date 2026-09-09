import { getAppConfig } from '@/config/env';
import {
  resolveEffectiveServerUrl,
  SERVER_URL_SETTING_KEY,
} from '@/domain/server-url';
import { deleteSetting, getSetting, saveSetting } from '@/storage/local-database';

export async function getSavedServerUrl(): Promise<string | null> {
  try {
    const value = await getSetting(SERVER_URL_SETTING_KEY);
    return value && value.trim().length > 0 ? value : null;
  } catch {
    return null;
  }
}

export async function saveServerUrlOverride(url: string): Promise<void> {
  await saveSetting(SERVER_URL_SETTING_KEY, url);
}

export async function clearServerUrlOverride(): Promise<void> {
  try {
    await deleteSetting(SERVER_URL_SETTING_KEY);
  } catch {
    // A missing row is the same end state as clearing an override.
  }
}

export function getDefaultServerUrl(): string {
  return getAppConfig().apiBaseUrl;
}

export async function getEffectiveApiBaseUrl(): Promise<string> {
  const saved = await getSavedServerUrl();
  return resolveEffectiveServerUrl(saved, getAppConfig().apiBaseUrl);
}
