import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { secureKeyValueStore } from '@/storage/secure-store';

import type { DeviceMetadata } from '@/domain/types';

const DEVICE_ID_KEY = 'lesen.device-id.v1';

function createDeviceId(): string {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  if (randomUuid) {
    return randomUuid;
  }
  return `lesen-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
}

export async function getDeviceMetadata(): Promise<DeviceMetadata> {
  let deviceId = await secureKeyValueStore.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = createDeviceId();
    await secureKeyValueStore.setItem(DEVICE_ID_KEY, deviceId);
  }

  const fingerprint =
    Device.osBuildFingerprint ??
    Device.osBuildId ??
    `${Device.manufacturer ?? 'unknown'}-${Device.modelName ?? 'unknown'}-${Platform.OS}`;

  return {
    device_id: deviceId,
    fingerprint: fingerprint.length >= 8 ? fingerprint : `${fingerprint}-device`,
    platform: Platform.OS,
    app_version: Constants.expoConfig?.version ?? '0.0.0',
    model: Device.modelName ?? Device.productName ?? 'unknown',
  };
}