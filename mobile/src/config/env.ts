import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type AppEnvironment = 'development' | 'staging' | 'production';

export type AppPlatform = 'ios' | 'android';

export type AppConfig = {
  apiBaseUrl: string;
  environment: AppEnvironment;
  appVersion: string;
  /**
   * Which store build is running. Sent as `submitted_from.platform` so the
   * backend can record the build that filed a report; the enum matches the
   * `platform` field on `accident_submitted_from_struct`, which rejects anything
   * outside it.
   */
  platform: AppPlatform;
  /**
   * Categorized accident-image upload (`file.uploadAccidentImages`, base64 JSON
   * wire format). Dormant until enabled explicitly so the sync flow cannot be
   * broken by an untested payload path; flip with EXPO_PUBLIC_ACCIDENT_UPLOADS=on.
   */
  uploadsEnabled: boolean;
  /**
   * URL of the self-hosted MapLibre style document for the vector tile server.
   *
   * There is no public fallback. The previous raster build defaulted to the
   * public OSM tile host, which violates the OSM tile usage policy and puts a
   * third party on the officer's critical path; an unset variable now fails
   * loudly instead of silently pointing at it.
   */
  mapStyleUrl: string;
};

function readUploadsEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === 'on';
}

function readMapStyleUrl(value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    // Deliberately not a fallback: a default public host is the defect this
    // replaced. Name the variable so a misconfigured build is obvious.
    throw new Error(
      'EXPO_PUBLIC_MAP_STYLE_URL is required: point it at the self-hosted vector tile style document.',
    );
  }
  return trimmed;
}

function readEnvironment(value: string | undefined): AppEnvironment {
  if (value === 'staging' || value === 'production') {
    return value;
  }
  return 'development';
}

function normalizeLesanUrl(value: string | undefined): string {
  const baseUrl = value?.trim().replace(/\/$/, '');
  if (!baseUrl) {
    throw new Error('EXPO_PUBLIC_LESAN_URL is required before making API requests.');
  }
  return baseUrl.endsWith('/lesan') ? baseUrl : `${baseUrl}/lesan`;
}

export function getAppConfig(): AppConfig {
  return {
    apiBaseUrl: normalizeLesanUrl(
      process.env.EXPO_PUBLIC_LESAN_URL ?? process.env.EXPO_PUBLIC_API_URL,
    ),
    environment: readEnvironment(process.env.EXPO_PUBLIC_APP_ENV),
    appVersion: Constants.expoConfig?.version ?? '0.0.0',
    // Web and any unrecognised target are reported as `ios` rather than dropped:
    // the field is required by the validator, and a build that cannot name its
    // platform is not one this app ships.
    platform: Platform.OS === 'android' ? 'android' : 'ios',
    uploadsEnabled: readUploadsEnabled(process.env.EXPO_PUBLIC_ACCIDENT_UPLOADS),
    mapStyleUrl: readMapStyleUrl(process.env.EXPO_PUBLIC_MAP_STYLE_URL),
  };
}