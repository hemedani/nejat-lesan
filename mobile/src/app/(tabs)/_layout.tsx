import { useEffect } from 'react';
import { Tabs } from 'expo-router';

import PatrolTabBar, { type PatrolTabBarProps } from '@/components/patrol-tab-bar';
import { startMapDownloadWatcher } from '@/services/map-download';
import { getSyncWorker } from '@/services/sync-worker';

export default function TabsLayout() {
  useEffect(() => {
    const stopSync = getSyncWorker().start();
    const stopMapWatcher = startMapDownloadWatcher();
    return () => {
      stopSync();
      stopMapWatcher();
    };
  }, []);

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={props => <PatrolTabBar {...(props as unknown as PatrolTabBarProps)} />}
    />
  );
}
