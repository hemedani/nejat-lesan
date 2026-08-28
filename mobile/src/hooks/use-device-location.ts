import * as Location from 'expo-location';
import { Linking } from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Coordinates } from '@/domain/types';

export type DeviceLocationStatus =
  | 'idle'
  | 'locating'
  | 'granted'
  | 'denied'
  | 'service_disabled'
  | 'error';

export type DeviceLocationState = {
  status: DeviceLocationStatus;
  coords: Coordinates | null;
  accuracyMeters: number | null;
};

const INITIAL_STATE: DeviceLocationState = {
  status: 'idle',
  coords: null,
  accuracyMeters: null,
};

const SERVICE_POLL_INTERVAL_MS = 2500;

export type GpsRecoveryAction = {
  label: string;
  run: () => void;
};

/** Opens the page where the officer can turn location services back on. */
export function openLocationSettings(): void {
  if (typeof Linking.sendIntent === 'function') {
    try {
      Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
      return;
    } catch {
      // fall through to the generic app-settings page below
    }
  }
  void Linking.openSettings();
}

export function useDeviceLocation() {
  const [state, setState] = useState<DeviceLocationState>(INITIAL_STATE);
  const [canAskAgain, setCanAskAgain] = useState<boolean | null>(null);

  const locate = useCallback(async (): Promise<boolean> => {
    setState(previous =>
      previous.status === 'locating' ? previous : { ...previous, status: 'locating' },
    );
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        // Keep the last known fix; only report that live GPS is unavailable.
        setState(previous => ({ ...previous, status: 'service_disabled' }));
        return false;
      }

      let permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted && permission.canAskAgain) {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      setCanAskAgain(permission.canAskAgain);
      if (!permission.granted) {
        setState(previous => ({ ...previous, status: 'denied' }));
        return false;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setState({
        accuracyMeters: position.coords.accuracy ?? null,
        coords: { latitude: position.coords.latitude, longitude: position.coords.longitude },
        status: 'granted',
      });
      return true;
    } catch {
      setState(previous => ({ ...previous, status: 'error' }));
      return false;
    }
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      setCanAskAgain(permission.canAskAgain);
      if (permission.granted) {
        await locate();
      } else {
        setState(previous => ({ ...previous, status: 'denied' }));
      }
    } catch {
      setState(previous => ({ ...previous, status: 'error' }));
    }
  }, [locate]);

  // While location services are reported off, keep polling so the moment the
  // officer enables GPS (quick settings / system page) this hook recovers by
  // itself instead of staying stuck until the screen is remounted.
  useEffect(() => {
    if (state.status !== 'service_disabled') {
      return;
    }
    let cancelled = false;
    const interval = setInterval(() => {
      void Location.hasServicesEnabledAsync()
        .then(enabled => {
          if (!cancelled && enabled) {
            void locate();
          }
        })
        .catch(() => undefined);
    }, SERVICE_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [state.status, locate]);

  const recoveryAction = useMemo<GpsRecoveryAction | null>(() => {
    switch (state.status) {
      case 'service_disabled':
        return { label: 'روشن کردن GPS', run: openLocationSettings };
      case 'denied':
        return canAskAgain === false
          ? { label: 'باز کردن تنظیمات دستگاه', run: () => void Linking.openSettings() }
          : { label: 'اجازه دسترسی به موقعیت', run: () => void requestPermission() };
      case 'error':
      case 'idle':
        return { label: 'تلاش برای دریافت موقعیت', run: () => void locate() };
      default:
        return null;
    }
  }, [state.status, canAskAgain, locate, requestPermission]);

  return { ...state, canAskAgain, locate, requestPermission, recoveryAction };
}
