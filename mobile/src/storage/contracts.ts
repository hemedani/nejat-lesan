export type KeyValueStore = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  deleteItem(key: string): Promise<void>;
};

export type NonSensitiveCache = {
  user_id?: string;
  personnel_code?: string;
  display_name?: string;
  permissions?: import('@/domain/types').PatrolPermissions;
  last_sync_at?: string;
};