import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api/errors';
import { snapPointToRoad, validatePointInZone } from '@/api/road';
import { saveIncidentLocation } from '@/domain/draft-actions';
import { toRoadSnap } from '@/domain/road-snap';
import { snapToCachedOrgRoad } from '@/services/org-road-service';
import {
  ACCURACY_WARNING_METERS,
  formatCoordinate,
  formatDistance,
  haversineMeters,
  OFFICER_DISTANCE_WARNING_METERS,
} from '@/domain/location-utils';
import type { Coordinates, RoadSnap, ZoneCheckRecord } from '@/domain/types';
import {
  DEFAULT_INCIDENT_ZOOM,
  formatCoordinates,
  organizationPoint,
  organizationZoom,
} from '@/domain/organization';
import { NativeMap, type NativeMapHandle } from '@/components/native-map';
import { GpsActionButton } from '@/components/gps-action-button';
import { ThemedText } from '@/components/themed-text';
import { Banner } from '@/components/ui/banner';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { MapControls } from '@/components/ui/map-controls';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StatusPill } from '@/components/ui/status-pill';
import { AppIcons, iconProps, type IconFamily, type IconName } from '@/constants/icon-map';
import { AppTheme, Estedad, Radius, Shadow } from '@/constants/theme';
import { useBottomInset } from '@/hooks/use-bottom-inset';
import { useDeviceLocation } from '@/hooks/use-device-location';
import { getConnectivitySnapshot } from '@/services/connectivity';
import { useRequiredSession } from '@/auth/use-required-session';
import { useOrgRoadLines } from '@/hooks/use-org-road-lines';

const FALLBACK_CENTER: Coordinates = { latitude: 35.6892, longitude: 51.389 };

const SNAP_DEBOUNCE_MS = 900;
const SNAP_SUGGEST_METERS = 20;
const SHEET_MIN_BOTTOM_PADDING = 16;

type SnapState = 'idle' | 'loading' | 'done' | 'failed' | 'no_road' | 'offline';

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
  const sheetBottomPadding = useBottomInset(SHEET_MIN_BOTTOM_PADDING);
  const params = useLocalSearchParams<{ uuid?: string; lat?: string; lng?: string }>();
  const deviceLocation = useDeviceLocation();
  const { locate } = deviceLocation;
  const mapRef = useRef<NativeMapHandle | null>(null);
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

  // سازمانِ مأمور، از نشستِ بازیابی‌شده. آفلاین هم در دسترس است چون هنگام
  // ورود ذخیره شده و هیچ درخواستی اینجا زده نمی‌شود.
  const organization = session?.primaryOrganization ?? null;
  const organizationCenter = useMemo(() => organizationPoint(organization), [organization]);

  // راهِ خودِ سازمان، از حافظهٔ دستگاه. هیچ درخواستی اینجا زده نمی‌شود تا
  // مأمور بی‌اینترنت هم آن را روی نقشه ببیند.
  const road = useOrgRoadLines(organization?._id);

  // اولویت قابِ نقشه: واقعه‌ی در حال ویرایش ← مرکز سازمان ← تهران.
  // تهران فقط آخرین fallback است؛ یک مأمورِ اهوازی نباید نقشه را در پایت ببیند.
  const mapInitialCenter = useMemo<Coordinates>(
    () => initialSelected ?? organizationCenter ?? FALLBACK_CENTER,
    [initialSelected, organizationCenter],
  );

  // در حالت ویرایش، قابِ سازمان اشتباه است: مأمور دارد همان نقطه‌ای را که خودش
  // ثبت کرده بازبینی می‌کند، نه کلِ قلمرو سازمان را.
  const mapInitialZoom = useMemo(
    () => (initialSelected ? DEFAULT_INCIDENT_ZOOM : organizationZoom(organization)),
    [initialSelected, organization],
  );

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

  /**
   * The offline half of a snap.
   *
   * The organization's own centreline is already in SQLite, so an officer with no
   * signal still gets the road, kilometre/meter and direction from the backend's
   * own projection. When the road has no geometry to project onto, the picker keeps
   * its «اطلاعات راه پس از اتصال تکمیل میشود» notice and the sync worker completes
   * the snap later.
   */
  async function resolveOfflineSnap(coords: Coordinates, signal: AbortSignal) {
    const organizationId = organization?._id;
    if (organizationId) {
      try {
        const snap = await snapToCachedOrgRoad(organizationId, coords);
        if (signal.aborted) {
          return;
        }
        if (snap) {
          setRoadSnap(snap);
          setSnapState('done');
          return;
        }
      } catch {
        // Fall through to the honest offline notice rather than a failed state.
      }
    }
    if (!signal.aborted) {
      setSnapState('offline');
    }
  }

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
            await resolveOfflineSnap(coords, controller.signal);
            return;
          }
          const response = await snapPointToRoad(coords, {
            signal: controller.signal,
            token: session?.token,
          });
          if (controller.signal.aborted) {
            return;
          }
          setRoadSnap(toRoadSnap(response));
          setSnapState('done');
        } catch (error) {
          if (controller.signal.aborted) {
            return;
          }
          if (error instanceof ApiError && error.code === 'offline') {
            await resolveOfflineSnap(coords, controller.signal);
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

  // مأمور لازم نیست برای دیدن قلمرو سازمانش دستی بزرگ‌نمایی کند؛ یک ضربه
  // نقشه را با همان بزرگ‌نماییِ سازمان روی مرکزش می‌برد. پین وسط صفحه از
  // مسیر `moveend` جابه‌جا نمی‌شود، پس این فقط دوربین است و نه انتخاب نقطه.
  function moveToOrganizationCenter() {
    if (!organizationCenter) {
      return;
    }
    mapRef.current?.setCenter(organizationCenter, organizationZoom(organization));
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
        <NativeMap
          initialCenter={mapInitialCenter}
          initialZoom={mapInitialZoom}
          officerMarker={deviceLocation.coords}
          onRegionChangeComplete={handleRegionChangeComplete}
          ref={mapRef}
          roadLabel={road?.label ?? null}
          roadLines={road?.lines ?? null}
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

      {/* The confirm CTA lives at the bottom of this sheet, so the sheet — not the
          screen — has to clear the Android navigation bar. `edges={['top']}` above
          deliberately leaves the bottom to this element: padding the whole screen
          would lift the map off the bottom edge for no reason. */}
      <View style={[styles.sheet, { paddingBottom: sheetBottomPadding }]}>
        <View style={styles.grabber} />

        {/* Everything here is context the officer reads; the CTA below is the one
            thing they must be able to reach. The sheet is capped with `maxHeight`
            rather than sized to its content, so the scroll area is the single
            element allowed to give way — otherwise the extra rows a road snap adds,
            plus the snap suggestion banner, push the button off the bottom of the
            screen with no way to scroll to it. */}
        <ScrollView
          contentContainerStyle={styles.sheetScrollContent}
          showsVerticalScrollIndicator
          style={styles.sheetScroll}
        >
          {organization ? (
            <View style={styles.organizationRow}>
              <View style={styles.organizationText}>
                <Text numberOfLines={1} style={styles.organizationName}>
                  {organization.name}
                </Text>
                <Text style={styles.organizationMeta}>
                  {organizationCenter
                    ? `مرکز سازمان · ${formatCoordinates(organizationCenter)}`
                    : 'سازمان · مرکز ثبت نشده'}
                </Text>
              </View>
              {organizationCenter ? (
                <Button
                  icon={AppIcons.nav.refresh.name}
                  iconFamily={AppIcons.nav.refresh.family}
                  label="مرکز سازمان"
                  onPress={moveToOrganizationCenter}
                  variant="soft"
                />
              ) : null}
            </View>
          ) : null}
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
            <SummaryRow icon={AppIcons.map.route} label="راه نزدیک" value="در حال محاسبه…" />
          ) : null}
          {snapState === 'done' && roadSnap ? (
            <>
              <SummaryRow icon={AppIcons.map.route} label="راه نزدیک" value={roadSnap.road_name ?? '—'} />
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

          {/* A suggestion, never a rule. Incidents legitimately happen off the
              carriageway — on a ramp, in a service area, or on the road boundary —
              so the officer keeps whatever point they chose and only moves it if
              they want to. This is why the banner is `info` and not `warning`: a
              warning tone reads as "something is wrong and must be fixed", and the
              confirm CTA below stays enabled either way. */}
          {suggestSnap && roadSnap?.nearest_point ? (
            <Banner
              actionLabel="انتقال به مسیر"
              {...iconProps(AppIcons.map.route)}
              message={`نقطه انتخابی ${formatDistance(roadSnap.distance_to_road_meters)} با محور راه فاصله دارد. اگر واقعه روی سطح سواره‌رو رخ داده، آن را به نزدیک‌ترین موقعیت روی محور منتقل کنید؛ در غیر این صورت همین نقطه ثبت می‌شود.`}
              tone="info"
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
        </ScrollView>

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
    // The sheet is capped, not sized, so the map keeps the top of the screen and
    // the officer can still see the pin they are placing. Everything past this
    // height is the scroll area's to absorb.
    maxHeight: '48%',
    // The scroll area clips to the rounded corners; without this its content
    // paints square over them on Android.
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingTop: 10,
    // `paddingBottom` is set inline from the safe-area inset — see the sheet.
  },
  sheetScroll: {
    // The one element allowed to shrink inside a `maxHeight` sheet. Without it
    // the ScrollView keeps its full content height, the sheet overflows, and the
    // CTA pinned below falls off the bottom of the screen.
    flexGrow: 0,
    flexShrink: 1,
  },
  sheetScrollContent: {
    // The sheet's own `gap` now only separates grabber / scroll area / CTA, so
    // the spacing between rows and banners has to live here.
    gap: 9,
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
  organizationRow: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.surfaceMuted,
    borderRadius: Radius.md,
    flexDirection: 'row-reverse',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  organizationText: { flex: 1, gap: 2 },
  organizationName: {
    color: AppTheme.colors.textStrong,
    fontFamily: Estedad.semiBold,
    fontSize: 14,
    textAlign: 'right',
  },
  organizationMeta: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 12,
    textAlign: 'right',
  },
});
