import { useCallback, useEffect, useState } from 'react';

import {
  getNationalPack,
  isWifiOnlyDownloads,
  subscribeToMapPacks,
  type MapPackView,
} from '@/services/map-download';

export type NationalMapPackState = {
  pack: MapPackView | null;
  wifiOnly: boolean;
};

/**
 * Polls the (tiny) pack record so progress bars stay live even though the
 * download engine writes throttled updates to SQLite.
 */
export function useNationalMapPack(pollMs = 800): NationalMapPackState & { reload: () => void } {
  const [state, setState] = useState<NationalMapPackState>({ pack: null, wifiOnly: true });

  const reload = useCallback(() => {
    void (async () => {
      const [pack, wifiOnly] = await Promise.all([getNationalPack(), isWifiOnlyDownloads()]);
      setState(previous =>
        samePack(previous.pack, pack) && previous.wifiOnly === wifiOnly
          ? previous
          : { pack, wifiOnly },
      );
    })();
  }, []);

  useEffect(() => {
    reload();
    const unsubscribe = subscribeToMapPacks(reload);
    const interval = setInterval(reload, pollMs);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [reload, pollMs]);

  return { ...state, reload };
}

function samePack(a: MapPackView | null, b: MapPackView | null): boolean {
  if (!a || !b) {
    return a === b;
  }
  return (
    a.status === b.status &&
    a.tierId === b.tierId &&
    a.tilesDone === b.tilesDone &&
    a.tilesTotal === b.tilesTotal &&
    a.bytesDone === b.bytesDone &&
    a.error === b.error
  );
}
