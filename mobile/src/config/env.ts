import Constants from 'expo-constants';

export type AppEnvironment = 'development' | 'staging' | 'production';

export type AppConfig = {
  apiBaseUrl: string;
  environment: AppEnvironment;
  appVersion: string;
};

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
  };
}