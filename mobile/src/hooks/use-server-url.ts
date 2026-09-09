import { useCallback, useEffect, useState } from 'react';

import { getDefaultServerUrl, getSavedServerUrl } from '@/services/server-url';

export type ServerUrlState = {
  loading: boolean;
  savedUrl: string | null;
  defaultUrl: string;
  effectiveUrl: string;
  hasOverride: boolean;
  refresh: () => Promise<void>;
};

type ServerUrlSnapshot = { saved: string | null; defaults: string };

export function useServerUrl(): ServerUrlState {
  const [loading, setLoading] = useState(true);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [defaultUrl, setDefaultUrl] = useState('');
  const [effectiveUrl, setEffectiveUrl] = useState('');

  const load = useCallback(async (): Promise<ServerUrlSnapshot> => {
    let defaults = '';
    try {
      defaults = getDefaultServerUrl();
    } catch {
      defaults = '';
    }
    const saved = await getSavedServerUrl();
    return { saved, defaults };
  }, []);

  const apply = useCallback((snapshot: ServerUrlSnapshot) => {
    setSavedUrl(snapshot.saved);
    setDefaultUrl(snapshot.defaults);
    setEffectiveUrl(snapshot.saved ?? snapshot.defaults);
  }, []);

  const refresh = useCallback(async () => {
    const snapshot = await load();
    apply(snapshot);
    setLoading(false);
  }, [load, apply]);

  useEffect(() => {
    let mounted = true;
    void load().then(snapshot => {
      if (mounted) {
        apply(snapshot);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [load, apply]);

  return {
    loading,
    savedUrl,
    defaultUrl,
    effectiveUrl,
    hasOverride: !!savedUrl,
    refresh,
  };
}
