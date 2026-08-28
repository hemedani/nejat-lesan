import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getOrCreateActiveDraft } from '@/domain/draft-actions';
import type { AccidentDraft } from '@/domain/types';
import { formatCoordinate, formatDistance } from '@/domain/location-utils';
import { getDraft } from '@/storage/local-database';
import { Button } from '@/components/ui/button';
import { Banner } from '@/components/ui/banner';
import { Card, CardHeader } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { SkeletonCard } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { AppIcons, type IconFamily, type IconName } from '@/constants/icon-map';
import { AppTheme, Estedad, Radius, Shadow } from '@/constants/theme';
import { useRequiredSession } from '@/auth/use-required-session';

type ZoneCheckData = {
  in_zone?: boolean;
  reason?: string;
  police_station?: string;
};

export default function IncidentDraftScreen() {
  const router = useRouter();
  const session = useRequiredSession();
  const [draft, setDraft] = useState<AccidentDraft | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const uuidRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!session) {
      return;
    }
    getOrCreateActiveDraft()
      .then(createdDraft => {
        if (mounted) {
          uuidRef.current = createdDraft.client_report_uuid;
          setDraft(createdDraft);
        }
      })
      .catch(() => {
        if (mounted) {
          setErrorMessage('ذخیره پیش‌نویس انجام نشد. دوباره تلاش کنید.');
        }
      });
    return () => {
      mounted = false;
    };
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const uuid = uuidRef.current;
      if (!uuid) {
        return;
      }
      getDraft(uuid)
        .then(fresh => {
          if (!cancelled && fresh) {
            setDraft(fresh);
          }
        })
        .catch(() => undefined);
      return () => {
        cancelled = true;
      };
    }, []),
  );

  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator color={AppTheme.colors.primary} />
      </SafeAreaView>
    );
  }

  function openLocationPicker() {
    if (!draft) {
      return;
    }
    const { incident_coords: coords } = draft;
    router.push({
      pathname: '/incident/location',
      params: {
        uuid: draft.client_report_uuid,
        ...(coords ? { lat: String(coords.latitude), lng: String(coords.longitude) } : {}),
      },
    });
  }

  const zoneCheck = draft?.data['zone_check'] as ZoneCheckData | undefined;
  const hasLocation = Boolean(draft?.incident_coords);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader onBack={() => router.back()} title="ثبت واقعه جدید" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.description}>
          ابتدا محل حادثه را روی نقشه مشخص کنید؛ سپس نوع واقعه را انتخاب و گزارش را تکمیل کنید.
          همه‌چیز حتی در حالت آفلاین ذخیره و قابل ادامه است.
        </Text>

        {!draft && !errorMessage ? (
          <View style={styles.skeletonGap}>
            <SkeletonCard height={120} />
            <SkeletonCard height={96} />
          </View>
        ) : null}

        {errorMessage ? (
          <Banner
            actionLabel="تلاش دوباره"
            icon={AppIcons.status.error.name}
            message={errorMessage}
            tone="danger"
            title="خطا در آماده‌سازی پیش‌نویس"
          />
        ) : null}

        {draft ? (
          <>
            <Card variant="default">
              <CardHeader
                action={
                  <Button
                    icon={AppIcons.map.editLocation.name}
                    label={hasLocation ? 'اصلاح موقعیت' : 'انتخاب موقعیت'}
                    onPress={openLocationPicker}
                    size="md"
                    variant="soft"
                  />
                }
                icon={AppIcons.map.pinIncident.name}
                title="محل حادثه"
              />
              {hasLocation && draft.incident_coords ? (
                <View style={styles.locationBody}>
                  <View style={styles.coordRow}>
                    <Icon color={AppTheme.colors.textSecondary} name="navigate" size={15} />
                    <Text style={styles.coordValue}>
                      {formatCoordinate(draft.incident_coords.latitude)} ،{' '}
                      {formatCoordinate(draft.incident_coords.longitude)}
                    </Text>
                  </View>
                  {draft.road_snap ? (
                    <>
                      <SummaryLine
                        icon={AppIcons.map.route}
                        value={`${draft.road_snap.road_name ?? '—'}${draft.road_snap.direction ? ` · ${draft.road_snap.direction}` : ''}`}
                      />
                      <SummaryLine
                        icon={AppIcons.map.kilometer}
                        value={`کیلومتر ${(draft.road_snap.kilometer ?? 0).toLocaleString('fa-IR')}+${(draft.road_snap.meter ?? 0).toLocaleString('fa-IR')} · فاصله از راه ${formatDistance(draft.road_snap.distance_to_road_meters)}`}
                      />
                    </>
                  ) : (
                    <SummaryLine icon={AppIcons.status.info} value="اطلاعات راه پس از اتصال تکمیل می‌شود." warn />
                  )}
                  {draft.gps_coords ? (
                    <SummaryLine
                      icon={AppIcons.status.gpsOk}
                      value={draft.gps_unavailable ? 'GPS در لحظه ثبت در دسترس نبود' : 'موقعیت مأمور ثبت شد'}
                    />
                  ) : (
                    <SummaryLine icon={AppIcons.status.gpsOff} value="موقعیت GPS مأمور ثبت نشده است." warn />
                  )}
                </View>
              ) : (
                <Text style={styles.emptyLocation}>
                  هنوز موقعیتی انتخاب نشده است؛ برای ادامه، محل حادثه را روی نقشه تأیید کنید.
                </Text>
              )}
            </Card>

            {zoneCheck && !zoneCheck.in_zone ? (
              <Banner
                icon={AppIcons.status.warning.name}
                message={zoneCheck.reason ?? 'نقطه انتخابی خارج از محدوده گشت شما است؛ با این حال ثبت گزارش امکان‌پذیر است.'}
                tone="warning"
                title="هشدار محدوده"
              />
            ) : null}

            <SectionHeader icon={AppIcons.phases.classification.name} iconFamily={AppIcons.phases.classification.family} title="نوع واقعه" />
            <View style={styles.typeGrid}>
              <TypeTile
                caption={hasLocation ? 'ثبت کامل اطلاعات تصادف' : 'ابتدا محل حادثه را تأیید کنید'}
                disabled={!hasLocation}
                icon={AppIcons.phases.vehicles}
                label="تصادف"
                onPress={() =>
                  draft.client_report_uuid &&
                  hasLocation &&
                  router.push({ pathname: '/incident/details', params: { uuid: draft.client_report_uuid } })
                }
              />
              <TypeTile caption="به‌زودی در نسخه‌های بعدی" disabled icon={AppIcons.facility.needsRepair} label="خرابی آزادراه" />
              <TypeTile caption="به‌زودی در نسخه‌های بعدی" disabled icon={AppIcons.status.warning} label="مانع یا خطر در مسیر" />
              <TypeTile caption="به‌زودی در نسخه‌های بعدی" disabled icon={AppIcons.collision.unknown} label="سایر رخدادها" />
            </View>

            {hasLocation ? (
              <Button
                fullWidth
                icon={AppIcons.phases.basicInfo.name}
                label="تکمیل اطلاعات گزارش تصادف"
                onPress={() => router.push({ pathname: '/incident/details', params: { uuid: draft.client_report_uuid } })}
                size="lg"
                style={styles.cta}
              />
            ) : null}
          </>
        ) : null}

        <Button fullWidth label="بازگشت به داشبورد" onPress={() => router.back()} variant="outline" />
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryLine({
  icon,
  value,
  warn = false,
}: {
  icon: { name: IconName; family?: IconFamily };
  value: string;
  warn?: boolean;
}) {
  return (
    <View style={styles.summaryLine}>
      <Icon color={warn ? AppTheme.status.warning.text : AppTheme.colors.primaryStrong} family={icon.family} name={icon.name} size={15} />
      <Text style={[styles.summaryValue, warn && styles.summaryWarn]}>{value}</Text>
    </View>
  );
}

function TypeTile({
  label,
  caption,
  icon,
  disabled = false,
  onPress,
}: {
  label: string;
  caption: string;
  icon: { name: IconName; family?: IconFamily };
  disabled?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.typeTile,
        Shadow.card,
        pressed && !disabled && styles.pressed,
        disabled && styles.typeTileDisabled,
      ]}
    >
      <View style={styles.typeHead}>
        <View style={[styles.typeIcon, disabled && styles.typeIconMuted]}>
          <Icon color={disabled ? AppTheme.colors.textFaint : AppTheme.colors.primaryStrong} family={icon.family} name={icon.name} size={22} />
        </View>
        {disabled ? <StatusPill label="به‌زودی" tone="neutral" /> : <Icon color={AppTheme.colors.textFaint} name="chevron-back" size={16} />}
      </View>
      <Text style={[styles.typeLabel, disabled && styles.typeLabelDisabled]}>{label}</Text>
      <Text numberOfLines={2} style={[styles.typeCaption, disabled && styles.typeLabelDisabled]}>
        {caption}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: AppTheme.colors.background, flex: 1 },
  content: { gap: 16, padding: 20, paddingBottom: 40 },
  description: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 13.5,
    lineHeight: 22,
    textAlign: 'right',
  },
  skeletonGap: { gap: 12 },
  locationBody: { gap: 9 },
  coordRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 6,
  },
  coordValue: {
    color: AppTheme.colors.textStrong,
    fontFamily: Estedad.semiBold,
    fontSize: 14,
    textAlign: 'left',
  },
  summaryLine: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 7,
  },
  summaryValue: {
    color: AppTheme.colors.textBody,
    flexShrink: 1,
    fontFamily: Estedad.regular,
    fontSize: 12.5,
    lineHeight: 19,
    textAlign: 'right',
  },
  summaryWarn: {
    color: AppTheme.status.warning.deep,
  },
  emptyLocation: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'right',
  },
  typeGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeTile: {
    backgroundColor: AppTheme.colors.surface,
    borderColor: AppTheme.colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexGrow: 1,
    flexBasis: '47%',
    gap: 8,
    padding: 14,
  },
  typeTileDisabled: {
    opacity: 0.72,
  },
  typeHead: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  typeIcon: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.primarySoft,
    borderRadius: Radius.sm,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  typeIconMuted: {
    backgroundColor: AppTheme.colors.surfaceSunken,
  },
  typeLabel: {
    color: AppTheme.colors.textStrong,
    fontFamily: Estedad.semiBold,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'right',
  },
  typeLabelDisabled: {
    color: AppTheme.colors.textSecondary,
  },
  typeCaption: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 11.5,
    lineHeight: 18,
    textAlign: 'right',
  },
  cta: { marginTop: 4 },
  pressed: { opacity: 0.82 },
});
