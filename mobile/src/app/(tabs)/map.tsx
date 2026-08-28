import { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Coordinates } from '@/domain/types';
import { GpsActionButton } from '@/components/gps-action-button';
import { OsmWebMap, type OsmWebMapHandle } from '@/components/osm-web-map';
import { ThemedText } from '@/components/themed-text';
import { MapControls } from '@/components/ui/map-controls';
import { AppTheme } from '@/constants/theme';
import { useDeviceLocation } from '@/hooks/use-device-location';

const FALLBACK_CENTER: Coordinates = { latitude: 35.6892, longitude: 51.389 };

export default function MapScreen() {
  const deviceLocation = useDeviceLocation();
  const mapRef = useRef<OsmWebMapHandle | null>(null);

  // The map tab needs the officer position for the marker; fetch it on mount
  // and recover automatically when services/permissions come back.
  useEffect(() => {
    void deviceLocation.locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialCenter = useMemo<Coordinates>(
    () => deviceLocation.coords ?? FALLBACK_CENTER,
    // Intentionally computed once at mount so the WebView does not reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.mapContainer}>
        <OsmWebMap
          initialCenter={initialCenter}
          initialZoom={15}
          officerMarker={deviceLocation.coords}
          ref={mapRef}
          style={StyleSheet.absoluteFill}
        />

        <View style={[styles.statusCard, Platform.select({ android: styles.cardElevation })]}>
          <ThemedText style={styles.gpsTitle}>موقعیت مأمور</ThemedText>
          <ThemedText style={styles.gpsBody}>{gpsSummary(deviceLocation)}</ThemedText>
          {!deviceLocation.coords && (
            <GpsActionButton device={deviceLocation} variant="outline" />
          )}
        </View>

        <MapControls
          locateDisabled={!deviceLocation.coords}
          onLocate={() => deviceLocation.coords && mapRef.current?.setCenter(deviceLocation.coords)}
          onZoomIn={() => mapRef.current?.zoomBy(1)}
          onZoomOut={() => mapRef.current?.zoomBy(-1)}
          style={styles.mapControls}
        />

        <ThemedText style={styles.attribution}>© OpenStreetMap contributors</ThemedText>
      </View>
    </SafeAreaView>
  );
}

function gpsSummary(state: ReturnType<typeof useDeviceLocation>): string {
  switch (state.status) {
    case 'granted':
      return state.accuracyMeters != null
        ? `GPS فعال · دقت ${Math.round(state.accuracyMeters).toLocaleString('fa-IR')} متر`
        : 'GPS فعال';
    case 'locating':
      return 'در حال دریافت موقعیت…';
    case 'denied':
      return 'دسترسی به موقعیت رد شد؛ از تنظیمات دستگاه مجوز دهید.';
    case 'service_disabled':
      return 'سرویس موقعیت دستگاه خاموش است.';
    case 'error':
      return 'خطا در دریافت موقعیت.';
    default:
      return 'در انتظار بررسی موقعیت…';
  }
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: AppTheme.colors.background, flex: 1 },
  mapContainer: { flex: 1 },
  statusCard: {
    backgroundColor: AppTheme.colors.surface,
    borderColor: AppTheme.colors.border,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
    left: 16,
    padding: 14,
    position: 'absolute',
    right: 16,
    top: 16,
  },
  cardElevation: { elevation: 3 },
  gpsTitle: { color: AppTheme.colors.textSecondary, fontSize: 13 },
  gpsBody: { color: AppTheme.colors.textStrong, fontSize: 15, fontWeight: '700' },
  mapControls: {
    bottom: 24,
    left: 16,
    position: 'absolute',
  },
  attribution: {
    backgroundColor: '#ffffffcc',
    borderRadius: 8,
    bottom: 10,
    color: AppTheme.colors.textSecondary,
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    position: 'absolute',
    right: 10,
  },
});
