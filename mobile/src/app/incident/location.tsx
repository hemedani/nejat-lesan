import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api/errors';
import { snapPointToRoad, validatePointInZone } from '@/api/road';
import { saveIncidentLocation } from '@/domain/draft-actions';
import {
  ACCURACY_WARNING_METERS,
  formatCoordinate,
  formatDistance,
  haversineMeters,
  OFFICER_DISTANCE_WARNING_METERS,
} from '@/domain/location-utils';
import type { Coordinates, RoadSnap, ZoneCheckRecord } from '@/domain/types';
import { OsmWebMap, type OsmWebMapHandle } from '@/components/osm-web-map';
import { GpsActionButton } from '@/components/gps-action-button';
import { ThemedText } from '@/components/themed-text';
import { Banner } from '@/components/ui/banner';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { MapControls } from '@/components/ui/map-controls';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StatusPill } from '@/components/ui/status-pill';
import { AppIcons, type IconFamily, type IconName } from '@/constants/icon-map';
import { AppTheme, Estedad, Radius, Shadow } from '@/constants/theme';
import { useDeviceLocation } from '@/hooks/use-device-location';
import { getConnectivitySnapshot } from '@/services/connectivity';
import { useRequiredSession } from '@/auth/use-required-session';

const FALLBACK_CENTER: Coordinates = { latitude: 35.6892, longitude: 51.389 };

const SNAP_DEBOUNCE_MS = 900;
const SNAP_SUGGEST_METERS = 20;

type SnapState = 'idle' | 'loading' | 'done' | 'failed' | 'no_road' | 'offline';

function toRoadSnap(coords: Coordinates, response: Awaited<ReturnType<typeof snapPointToRoad>>): RoadSnap {
  return {
    distance_to_road_meters: response.distanceToRoadMeters,
    direction: response.direction,
    from_origin_meters: response.fromOriginMeters,
    kilometer: response.kilometer,
    lanes: response.lanes,
    meter: response.meter,
    nearest_point: {
      latitude: response.nearestPoint.coordinates[1],
      longitude: response.nearestPoint.coordinates[0],
    },
    road_id: response.road._id,
    road_name: response.road.name,
    total_length_meters: response.totalLengthMeters,
  };
}

function usePinPulse() {
  const value = useMemo(() => new Animated.Value(0), []);
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(value, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [value]);
  return value;
}

export default function IncidentLocationScreen() {
  const router = useRouter();
  const session = useRequiredSession();
  const params = useLocalSearchParams<{ uuid?: string; lat?: string; lng?: string }>();
  const deviceLocation = useDeviceLocation();
  const { locate } = deviceLocation;
  const mapRef = useRef<OsmWebMapHandle | null>(null);
  const snapAbortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulse = usePinPulse();

  const initialSelected = useMemo<Coordinates | null>(() => {
    const lat = Number(params.lat);
    const lng = Number(params.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng) && params.lat && params.lng) {
      return { latitude: lat, longitude: lng };
    }
    return null;
  }, [params.lat, params.lng]);

  const mapInitialCenter = useMemo<Coordinates>(() => initialSelected ?? FALLBACK_CENTER, [initialSelected]);

  const [userSelected, setUserSelected] = useState<Coordinates | null>(initialSelected);
  const selected = userSelected ?? deviceLocation.coords ?? null;
  const [snapState, setSnapState] = useState<SnapState>('idle');
  const [roadSnap, setRoadSnap] = useState<RoadSnap | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void locate();
  }, [locate]);

  useEffect(() => {
    if (!userSelected && deviceLocation.coords) {
      mapRef.current?.setCenter(deviceLocation.coords);
    }
  }, [deviceLocation.coords, userSelected]);

  function requestSnap(coords: Coordinates) {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    snapAbortRef.current?.abort();
    const controller = new AbortController();
    snapAbortRef.current = controller;
    setSnapState('loading');
    debounceRef.current = setTimeout(() => {
      void (async () => {
        try {
          const snapshot = await getConnectivitySnapshot();
          if (snapshot.status === 'offline') {
            setSnapState('offline');
            return;
          }
          const response = await snapPointToRoad(coords, {
            signal: controller.signal,
            token: session?.token,
          });
          if (controller.signal.aborted) {
            return;
          }
          setRoadSnap(toRoadSnap(coords, response));
          setSnapState('done');
        } catch (error) {
          if (controller.signal.aborted) {
            return;
          }
          if (error instanceof ApiError && error.code === 'offline') {
            setSnapState('offline');
            return;
          }
          if (
            error instanceof ApiError &&
            typeof (error.details as { message?: unknown } | null | undefined)?.message === 'string' &&
            String((error.details as { message: string }).message).includes('نزدیک‌ترین راه')
          ) {
            setSnapState('no_road');
            return;
          }
          setSnapState('failed');
        }
      })();
    }, SNAP_DEBOUNCE_MS);
  }

  function handleRegionChangeComplete(coords: Coordinates) {
    setUserSelected(coords);
    requestSnap(coords);
  }

  function moveToNearestPoint() {
    if (roadSnap?.nearest_point) {
      mapRef.current?.setCenter(roadSnap.nearest_point);
    }
  }

  async function handleConfirm() {
    if (!selected || isSaving || !session) {
      return;
    }
    setIsSaving(true);
    let zoneCheck: ZoneCheckRecord;
    try {
      const zone = await validatePointInZone(session, selected, { timeoutMs: 6000 });
      zoneCheck = {
        checked_at: new Date().toISOString(),
        in_zone: zone.inZone,
        police_station: zone.policeStation?.name,
        reason: zone.reason,
      };
    } catch {
      zoneCheck = {
        checked_at: new Date().toISOString(),
        in_zone: false,
        reason: 'بررسی محدوده انجام نشد',
      };
    }
    await saveIncidentLocation(params.uuid ?? '', {
      gps_coords: deviceLocation.coords,
      gps_unavailable: deviceLocation.coords == null,
      incident_coords: selected,
      road_snap: snapState === 'done' ? roadSnap : null,
      zone_check: zoneCheck,
    });
    setIsSaving(false);
    router.back();
  }

  const officerDistance =
    deviceLocation.coords && selected ? haversineMeters(deviceLocation.coords, selected) : null;

  const suggestSnap =
    snapState === 'done' &&
    roadSnap?.nearest_point != null &&
    (roadSnap.distance_to_road_meters ?? 0) > SNAP_SUGGEST_METERS;

  const confirmDisabledReason = !params.uuid
    ? 'پیش‌نویس فعال یافت نشد؛ به صفحه قبل بازگردید و دوباره تلاش کنید.'
    : !selected
      ? 'برای ادامه، نقطه حادثه را روی نقشه مشخص کنید.'
      : null;

  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.1] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.35, 0.12, 0] });

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScreenHeader onBack={() => router.back()} title="انتخاب محل حادثه" />

      <View style={styles.mapContainer}>
        <OsmWebMap
          initialCenter={mapInitialCenter}
          initialZoom={17}
          officerMarker={deviceLocation.coords}
          onRegionChangeComplete={handleRegionChangeComplete}
          ref={mapRef}
          style={StyleSheet.absoluteFill}
        />

        <View pointerEvents="none" style={styles.centerPinWrap}>
          <Animated.View
            style={[styles.pinHalo, { opacity: haloOpacity, transform: [{ scale: haloScale }] }]}
          />
          <Icon color={AppTheme.colors.primary} name="location" size={46} />
        </View>

        <View pointerEvents="none" style={styles.legendColumn}>
          <View style={[styles.legendChip, Shadow.floating]}>
            <Icon color={AppTheme.colors.primary} name="location" size={14} />
            <Text style={styles.legendText}>محل واقعه</Text>
          </View>
          <View style={[styles.legendChip, Shadow.floating]}>
            <Icon color={AppTheme.status.info.text} name="person-circle" size={15} />
            <Text style={styles.legendText}>موقعیت شما</Text>
          </View>
          <AccuracyPill device={deviceLocation} />
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

      <View style={styles.sheet}>
        <View style={styles.grabber} />
        {officerDistance != null ? (
          <SummaryRow
            icon={AppIcons.map.distance}
            label="فاصله تا شما"
            value={formatDistance(officerDistance)}
            warn={officerDistance > OFFICER_DISTANCE_WARNING_METERS}
          />
        ) : null}
        <SummaryRow
          icon={AppIcons.map.accuracy}
          label="دقت GPS"
          value={
            deviceLocation.accuracyMeters == null
              ? deviceLocation.coords
                ? '—'
                : 'موقعیت مأمور در دسترس نیست'
              : `${formatDistance(deviceLocation.accuracyMeters)}${deviceLocation.accuracyMeters > ACCURACY_WARNING_METERS ? ' · دقت پایین' : ''}`
          }
          warn={
            deviceLocation.status === 'denied' ||
            deviceLocation.status === 'service_disabled' ||
            (deviceLocation.accuracyMeters ?? 0) > ACCURACY_WARNING_METERS
          }
        />
        {snapState === 'loading' ? (
          <SummaryRow icon={AppIcons.map.route} label="تطبیق با راه" value="در حال محاسبه…" />
        ) : null}
        {snapState === 'done' && roadSnap ? (
          <>
            <SummaryRow icon={AppIcons.map.route} label="راه" value={roadSnap.road_name ?? '—'} />
            <SummaryRow icon={AppIcons.map.direction} label="جهت" value={roadSnap.direction ?? '—'} />
            <SummaryRow
              icon={AppIcons.map.kilometer}
              label="کیلومتر/متر"
              value={`${(roadSnap.kilometer ?? 0).toLocaleString('fa-IR')}+${(roadSnap.meter ?? 0).toLocaleString('fa-IR')}`}
            />
            <SummaryRow
              icon={AppIcons.map.distance}
              label="فاصله از راه"
              value={formatDistance(roadSnap.distance_to_road_meters)}
            />
          </>
        ) : null}
        {(snapState === 'failed' || snapState === 'no_road' || snapState === 'offline') && (
          <Banner
            message={
              snapState === 'offline'
                ? 'بدون اینترنت؛ اطلاعات راه پس از اتصال تکمیل می‌شود.'
                : snapState === 'no_road'
                  ? 'راهی در شعاع پوشش این نقطه ثبت نشده است؛ می‌توانید بدون آن ادامه دهید.'
                  : 'تطبیق با راه انجام نشد؛ می‌توانید بدون آن ادامه دهید.'
            }
            tone="neutral"
          />
        )}

        {suggestSnap && roadSnap?.nearest_point ? (
          <Banner
            actionLabel="انتقال"
            icon={AppIcons.map.locateMe.name}
            message={`نقطه انتخابی ${formatDistance(roadSnap.distance_to_road_meters)} با مسیر فاصله دارد؛ انتقال به نزدیک‌ترین موقعیت روی مسیر؟`}
            tone="warning"
            title="پیشنهاد تطبیق با راه"
            onAction={moveToNearestPoint}
          />
        ) : null}

        {!deviceLocation.coords ? (
          <>
            <Banner message="موقعیت GPS مأمور ثبت نمی‌شود؛ می‌توانید محل حادثه را دستی انتخاب کنید." tone="warning" />
            <GpsActionButton device={deviceLocation} variant="outline" />
          </>
        ) : null}

        {selected ? (
          <View style={styles.coordFooter}>
            <Icon color={AppTheme.colors.textFaint} name="navigate" size={13} />
            <Text style={styles.coordFooterText}>
              {formatCoordinate(selected.latitude)} ، {formatCoordinate(selected.longitude)}
            </Text>
          </View>
        ) : null}

        <Button
          accessibilityLabel="تأیید محل حادثه"
          disabled={Boolean(confirmDisabledReason) || isSaving}
          fullWidth
          icon={AppIcons.map.confirmLocation.name}
          label="تأیید موقعیت واقعه"
          loading={isSaving}
          onPress={() => void handleConfirm()}
          size="lg"
        />
        {confirmDisabledReason ? <Text style={styles.disabledHint}>{confirmDisabledReason}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

function AccuracyPill({ device }: { device: ReturnType<typeof useDeviceLocation> }) {
  const { status, accuracyMeters } = device;
  let tone: 'success' | 'warning' | 'danger' | 'neutral' = 'neutral';
  let label = 'GPS بررسی نشده';
  if (status === 'locating') {
    label = 'در حال دریافت…';
  } else if (status === 'granted') {
    if (accuracyMeters == null) {
      tone = 'success';
      label = 'GPS فعال';
    } else if (accuracyMeters <= ACCURACY_WARNING_METERS) {
      tone = 'success';
      label = `دقیق ±${Math.round(accuracyMeters).toLocaleString('fa-IR')} متر`;
    } else {
      tone = 'warning';
      label = `ضعیف ±${Math.round(accuracyMeters).toLocaleString('fa-IR')} متر`;
    }
  } else if (status === 'denied' || status === 'service_disabled') {
    tone = 'danger';
    label = 'GPS خاموش';
  }
  return (
    <StatusPill dot label={label} tone={tone} style={[styles.legendChip, Shadow.floating]} />
  );
}

function SummaryRow({
  label,
  value,
  warn,
  icon,
}: {
  label: string;
  value: string;
  warn?: boolean;
  icon: { name: IconName; family?: IconFamily };
}) {
  return (
    <View style={styles.row}>
      <Icon
        color={warn ? AppTheme.status.warning.text : AppTheme.colors.primaryStrong}
        family={icon.family}
        name={icon.name}
        size={15}
      />
      <ThemedText style={styles.rowLabel}>{label}</ThemedText>
      <ThemedText style={[styles.rowValue, warn && styles.rowValueWarn]}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: AppTheme.colors.background, flex: 1 },
  mapContainer: { flex: 1 },
  centerPinWrap: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: [{ translateY: -40 }],
  },
  pinHalo: {
    backgroundColor: AppTheme.colors.primary,
    borderRadius: Radius.pill,
    height: 44,
    position: 'absolute',
    width: 44,
  },
  legendColumn: {
    gap: 8,
    left: 12,
    position: 'absolute',
    top: 12,
  },
  legendChip: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: AppTheme.colors.surface,
    borderColor: AppTheme.colors.border,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row-reverse',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  legendText: {
    color: AppTheme.colors.textBody,
    fontFamily: Estedad.medium,
    fontSize: 11.5,
    lineHeight: 17,
  },
  mapControls: {
    bottom: 24,
    left: 16,
    position: 'absolute',
  },
  attribution: {
    backgroundColor: '#ffffffcc',
    borderRadius: 8,
    bottom: 8,
    color: AppTheme.colors.textSecondary,
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    position: 'absolute',
    right: 10,
  },
  sheet: {
    backgroundColor: AppTheme.colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    gap: 9,
    maxHeight: '48%',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 16,
  },
  grabber: {
    alignSelf: 'center',
    backgroundColor: AppTheme.colors.borderStrong,
    borderRadius: Radius.pill,
    height: 4,
    marginBottom: 4,
    width: 44,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 8,
    minHeight: 30,
  },
  rowLabel: { color: AppTheme.colors.textSecondary, fontSize: 13, flex: 1 },
  rowValue: { color: AppTheme.colors.textStrong, flexShrink: 1.6, fontSize: 14, fontWeight: '700', textAlign: 'left' },
  rowValueWarn: { color: AppTheme.status.warning.deep },
  coordFooter: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 5,
    marginTop: 2,
  },
  coordFooterText: {
    color: AppTheme.colors.textFaint,
    fontFamily: Estedad.regular,
    fontSize: 11,
    textAlign: 'left',
  },
  disabledHint: {
    color: AppTheme.status.danger.text,
    fontFamily: Estedad.regular,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'right',
  },
});
