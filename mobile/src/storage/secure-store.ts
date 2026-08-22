import * as SecureStore from 'expo-secure-store';

import type { KeyValueStore } from './contracts';

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

export const secureKeyValueStore: KeyValueStore = {
  getItem(key) {
    return SecureStore.getItemAsync(key, secureStoreOptions);
  },
  setItem(key, value) {
    return SecureStore.setItemAsync(key, value, secureStoreOptions);
  },
  deleteItem(key) {
    return SecureStore.deleteItemAsync(key, secureStoreOptions);
  },
};

export function isSecureStoreAvailable(): Promise<boolean> {
  return SecureStore.isAvailableAsync();
}