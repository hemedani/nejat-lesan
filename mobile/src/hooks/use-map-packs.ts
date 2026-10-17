import { useCallback, useEffect, useState } from 'react';

import type { MapCoverage } from '@/domain/map-coverage';
import {
  getMapPackViews,
  getOfflineCoverage,
  isWifiOnlyDownloads,
  subscribeToMapPacks,
  type MapPackView,
} from '@/services/map-download';

export type MapPacksState = {
  packs: MapPackView[];
  /** Widest zoom range actually on disk, or `null` before any download. */
  coverage: MapCoverage | null;
  wifiOnly: boolean;
};

/**
 * Reads the packs `OfflineManager` owns and re-reads on its progress events.
 * The poll is a safety net for packs that change state without an event of ours
 * (and for the first tick before any event has fired).
 */
export function useMapPacks(pollMs = 800): MapPacksState & { reload: () => void } {
  const [state, setState] = useState<MapPacksState>({ coverage: null, packs: [], wifiOnly: true });

  const reload = useCallback(() => {
    void (async () => {
      const [packs, coverage, wifiOnly] = await Promise.all([
        getMapPackViews(),
        getOfflineCoverage(),
        isWifiOnlyDownloads(),
      ]);
      setState(previous =>
        samePacks(previous.packs, packs) &&
        previous.wifiOnly === wifiOnly &&
        sameCoverage(previous.coverage, coverage)
          ? previous
          : { coverage, packs, wifiOnly },
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

/** Finds one pack by id, for screens that manage a single pack. */
export function useMapPack(id: string, pollMs = 800): MapPackView | null {
  return useMapPacks(pollMs).packs.find(pack => pack.id === id) ?? null;
}

function samePacks(a: MapPackView[], b: MapPackView[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((pack, index) => samePack(pack, b[index]));
}

function samePack(a: MapPackView, b: MapPackView): boolean {
  return (
    a.id === b.id &&
    a.status === b.status &&
    a.zoomMin === b.zoomMin &&
    a.zoomMax === b.zoomMax &&
    a.tierId === b.tierId &&
    a.tilesDone === b.tilesDone &&
    a.tilesTotal === b.tilesTotal &&
    a.bytesDone === b.bytesDone &&
    a.error === b.error
  );
}

function sameCoverage(a: MapCoverage | null, b: MapCoverage | null): boolean {
  if (!a || !b) {
    return a === b;
  }
  return a.zoomMin === b.zoomMin && a.zoomMax === b.zoomMax;
}