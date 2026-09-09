import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { translateApiError } from '@/api/errors';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Card } from '@/components/ui/card';
import { StatusPill } from '@/components/ui/status-pill';
import { Badge } from '@/components/ui/badge';
import { Banner } from '@/components/ui/banner';
import type { IconFamily, IconName } from '@/constants/icon-map';
import { AppIcons } from '@/constants/icon-map';
import { AppTheme, Estedad, Radius, Shadow } from '@/constants/theme';
import { formatBytes } from '@/domain/map-packs';
import { listDrafts } from '@/storage/local-database';
import { useActiveShift } from '@/hooks/use-active-shift';
import { useDeviceLocation, type DeviceLocationState } from '@/hooks/use-device-location';
import { useNationalMapPack } from '@/hooks/use-national-map-pack';
import { pauseNationalDownload, startNationalDownload } from '@/services/map-download';

const GPS_GOOD_METERS = 10;
const GPS_FAIR_METERS = 30;

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

function gpsStatus(state: DeviceLocationState): { tone: Tone; label: string } {
  switch (state.status) {
    case 'granted':
      if (state.accuracyMeters == null) {
        return { tone: 'success', label: 'فعال' };
      }
      if (state.accuracyMeters <= GPS_GOOD_METERS) {
        return { tone: 'success', label: `دقیق · ±${Math.round(state.accuracyMeters).toLocaleString('fa-IR')} متر` };
      }
      if (state.accuracyMeters <= GPS_FAIR_METERS) {
        return { tone: 'warning', label: `متوسط · ±${Math.round(state.accuracyMeters).toLocaleString('fa-IR')} متر` };
      }
      return { tone: 'warning', label: `ضعیف · ±${Math.round(state.accuracyMeters).toLocaleString('fa-IR')} متر` };
    case 'locating':
      return { tone: 'info', label: 'در حال دریافت…' };
    case 'denied':
      return { tone: 'danger', label: 'بدون مجوز' };
    case 'service_disabled':
      return { tone: 'danger', label: 'GPS خاموش' };
    case 'error':
      return { tone: 'danger', label: 'خطا' };
    default:
      return { tone: 'neutral', label: 'بررسی نشده' };
  }
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
}

export default function HomeScreen() {
  const router = useRouter();
  const {
    session,
    shift,
    shiftState,
    connectivity,
    isLoading,
    isRefreshing,
    lastSyncAt,
    errorMessage,
    refresh,
    logout,
  } = useActiveShift(translateApiError);
  const deviceLocation = useDeviceLocation();
  const mapPack = useNationalMapPack();
  const [draftCount, setDraftCount] = useState(0);

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace('/login');
    }
  }, [isLoading, session, router]);

  useEffect(() => {
    let mounted = true;
    listDrafts()
      .then(drafts => {
        if (mounted) {
          setDraftCount(drafts.filter(draft => draft.sync_status === 'draft').length);
        }
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [isRefreshing]);

  const confirmLogout = useCallback(() => {
    Alert.alert('خروج از حساب', 'آیا برای خروج از حساب کاربری مطمئن هستید؟', [
      { style: 'cancel', text: 'انصراف' },
      {
        onPress: () => {
          void logout().then(() => router.replace('/login'));
        },
        style: 'destructive',
        text: 'خروج',
      },
    ]);
  }, [logout, router]);

  const handleGpsPress = useCallback(() => {
    if (deviceLocation.recoveryAction) {
      deviceLocation.recoveryAction.run();
      return;
    }
    void deviceLocation.locate();
  }, [deviceLocation]);

  if (isLoading || !session) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={AppTheme.colors.primary} />
        <ThemedText style={styles.loadingText}>در حال آماده‌سازی سامانه</ThemedText>
      </SafeAreaView>
    );
  }

  const gps = gpsStatus(deviceLocation);
  const online = connectivity?.status !== 'offline';
  const weakInternet = connectivity?.status === 'weak';
  const shiftTone: Record<typeof shiftState, Tone> = {
    active: 'success',
    no_active_shift: 'neutral',
    unavailable: 'warning',
    loading: 'info',
  };
  const shiftLabel: Record<typeof shiftState, string> = {
    active: 'فعال',
    no_active_shift: 'بدون شیفت',
    unavailable: 'ناموجود',
    loading: 'در حال دریافت',
  };

  const initials = `${session.user.first_name.charAt(0)}${session.user.last_name.charAt(0)}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              void refresh();
            }}
            colors={[AppTheme.colors.primary]}
            tintColor={AppTheme.colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>داشبورد مأمور گشت</Text>
            <Text style={styles.greeting}>
              سلام {session.user.first_name} {session.user.last_name}
            </Text>
          </View>
          <Pressable
            accessibilityLabel="پروفایل و بیشتر"
            accessibilityRole="button"
            onPress={() => router.navigate('/more')}
            style={({ pressed }) => [styles.avatar, pressed && styles.pressedTile]}
          >
            <Text style={styles.avatarInitials}>{initials}</Text>
          </Pressable>
          <IconButton accessibilityLabel="خروج از حساب" icon="log-out" onPress={confirmLogout} tone="danger" />
        </View>

        <View style={[styles.unitStrip, Shadow.card]}>
          <Icon color={AppTheme.colors.primaryStrong} family={AppIcons.home.unit.family} name={AppIcons.home.unit.name} size={20} />
          <Text numberOfLines={1} style={styles.unitValue}>
            {shift?.patrol_unit?.title ?? 'واحد گشت تخصیص نیافته'}
          </Text>
          <View style={styles.unitDivider} />
          <Icon color={AppTheme.colors.primaryStrong} family={AppIcons.home.vehicle.family} name={AppIcons.home.vehicle.name} size={20} />
          <Text numberOfLines={1} style={styles.unitValue}>
            {shift?.vehicle ? `${shift.vehicle.title}${shift.vehicle.plate_number ? ` · ${shift.vehicle.plate_number}` : ''}` : 'خودروی شیفت ثبت نشده'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <StatusCard label="شیفت کاری" spec={AppIcons.home.shift}>
            <StatusPill label={shiftLabel[shiftState]} tone={shiftTone[shiftState]} dot style={styles.statusPill} />
          </StatusCard>
          <StatusCard label="اینترنت" spec={online ? AppIcons.status.online : AppIcons.status.offline}>
            <StatusPill
              label={online ? (weakInternet ? 'ضعیف' : 'آنلاین') : 'آفلاین'}
              tone={online ? (weakInternet ? 'warning' : 'success') : 'neutral'}
              dot
              style={styles.statusPill}
            />
          </StatusCard>
          <Pressable
            accessibilityLabel={`وضعیت موقعیت: ${gps.label}`}
            accessibilityRole="button"
            disabled={deviceLocation.status === 'locating' || deviceLocation.status === 'granted'}
            onPress={handleGpsPress}
            style={({ pressed }) => [styles.statusCellWrap, pressed && styles.pressedTile]}
          >
            <StatusCard
              label="موقعیت"
              spec={
                gps.tone === 'success'
                  ? AppIcons.status.gpsOk
                  : gps.tone === 'danger'
                    ? AppIcons.status.gpsOff
                    : AppIcons.status.gpsWeak
              }
            >
              <StatusPill label={gps.label} tone={gps.tone} dot style={styles.statusPill} />
            </StatusCard>
          </Pressable>
        </View>

        {errorMessage ? (
          <Banner message={errorMessage} tone="warning" title="دریافت اطلاعات شیفت" />
        ) : null}

        {shiftState === 'active' && shift ? (
          <Card variant="default">
            <View style={styles.shiftHead}>
              <Text style={styles.shiftTitle}>{shift.shift_type}</Text>
              <StatusPill label={shiftLabel[shiftState]} tone={shiftTone[shiftState]} icon="checkmark-circle" />
            </View>
            <Text style={styles.shiftMeta}>
              {formatTime(shift.starts_at)} تا {formatTime(shift.ends_at)}
            </Text>
          </Card>
        ) : null}

        <View style={styles.syncRow}>
          <Icon color={AppTheme.colors.textSecondary} name="cloud-done" size={16} />
          <Text style={styles.syncText}>
            آخرین همگام‌سازی: {lastSyncAt ? formatTime(lastSyncAt) : 'هنوز انجام نشده'}
          </Text>
          <IconButton
            accessibilityLabel="به‌روزرسانی"
            disabled={isRefreshing}
            icon="refresh"
            onPress={() => {
              void refresh();
            }}
            size={36}
            tone="primary"
          />
        </View>

        {!online ? (
          <Banner
            icon={AppIcons.status.offline.name}
            message="شما آفلاین هستید؛ اطلاعات روی دستگاه ذخیره و پس از اتصال به اینترنت به‌صورت خودکار ارسال می‌شود."
            tone="neutral"
          />
        ) : null}

        <Button
          fullWidth
          icon={AppIcons.home.registerIncident.name}
          label="ثبت واقعه جدید"
          onPress={() => router.push('/incident')}
          size="lg"
          style={styles.heroCta}
        />
        <Text style={styles.heroHint}>ثبت تصادف، خرابی یا سایر رخدادها — حتی در حالت آفلاین</Text>

        <OfflineMapCard
          onStartBase={() => void startNationalDownload('base')}
          onPause={() => void pauseNationalDownload()}
          pack={mapPack.pack}
        />

        <View style={styles.grid}>
          <QuickTile
            badgeCount={draftCount}
            badgeTone="primary"
            caption="ادامه و ویرایش گزارش‌ها"
            icon={AppIcons.home.drafts}
            label="پیش‌نویس‌ها"
            onPress={() => router.push('/drafts')}
          />
          <QuickTile
            caption="مشاهده سوابق و وضعیت"
            icon={AppIcons.home.myReports}
            label="گزارش‌های من"
            onPress={() => router.navigate('/reports')}
          />
          <QuickTile
            caption="پیام‌های مرکز کنترل"
            icon={AppIcons.home.announcements}
            label="اعلان‌ها"
            onPress={() => router.navigate('/announcements')}
          />
          <QuickTile
            caption="مشاهده موقعیت و رخدادها"
            icon={AppIcons.home.mapShortcut}
            label="نقشه"
            onPress={() => router.navigate('/map')}
          />
        </View>

        <Button
          fullWidth
          icon="apps-outline"
          label="بیشتر: پروفایل، راهنما و تنظیمات"
          onPress={() => router.navigate('/more')}
          variant="soft"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusCard({
  label,
  spec,
  children,
}: {
  label: string;
  spec: { name: IconName; family?: IconFamily };
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.statusCell, Shadow.card]}>
      <Icon color={AppTheme.colors.textSecondary} family={spec.family} name={spec.name} size={18} />
      <Text style={styles.statusCellLabel}>{label}</Text>
      {children}
    </View>
  );
}

function QuickTile({
  label,
  caption,
  icon,
  badgeCount,
  badgeTone = 'danger',
  onPress,
}: {
  label: string;
  caption: string;
  icon: { name: IconName; family?: IconFamily };
  badgeCount?: number;
  badgeTone?: 'primary' | 'danger';
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.tile, Shadow.card, pressed && styles.pressedTile]}
    >
      <View style={styles.tileTop}>
        <View style={styles.tileIcon}>
          <Icon color={AppTheme.colors.primaryStrong} family={icon.family} name={icon.name} size={22} />
        </View>
        {badgeCount != null && badgeCount > 0 ? <Badge count={badgeCount} tone={badgeTone} /> : null}
      </View>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text numberOfLines={2} style={styles.tileCaption}>
        {caption}
      </Text>
    </Pressable>
  );
}

function OfflineMapCard({
  pack,
  onStartBase,
  onPause,
}: {
  pack: ReturnType<typeof useNationalMapPack>['pack'];
  onStartBase: () => void;
  onPause: () => void;
}) {
  const router = useRouter();
  const progress =
    pack && pack.tilesTotal > 0 ? Math.min(100, Math.round((pack.tilesDone / pack.tilesTotal) * 100)) : 0;
  const working = pack?.status === 'queued' || pack?.status === 'downloading';

  const body = !pack
    ? 'برای استفاده بدون اینترنت، نسخه پایه کل ایران را ذخیره کنید (حدود ۱۰۰ مگابایت).'
    : working
      ? `در حال دانلود… ${progress.toLocaleString('fa-IR')}٪`
      : pack.status === 'paused'
        ? 'دانلود متوقف شده است.'
        : pack.status === 'failed'
          ? (pack.error ?? 'دانلود ناموفق بود.')
          : `نقشه آفلاین آماده است · ${formatBytes(pack.bytesDone)}`;

  return (
    <Pressable
      accessibilityLabel="نقشه آفلاین"
      accessibilityRole="button"
      onPress={() => router.push('/map-offline')}
      style={({ pressed }) => [styles.mapCard, Shadow.card, pressed && styles.pressedTile]}
    >
      <View style={styles.mapCardCopy}>
        <View style={styles.mapCardHead}>
          <Icon color={AppTheme.colors.primaryStrong} name="cloud-download" size={18} />
          <Text style={styles.mapCardTitle}>نقشه آفلاین</Text>
        </View>
        <Text numberOfLines={2} style={styles.mapCardBody}>
          {body}
        </Text>
        {working ? (
          <View style={styles.mapProgressTrack}>
            <View style={[styles.mapProgressFill, { width: `${progress}%` }]} />
          </View>
        ) : null}
      </View>
      {!pack || pack.status === 'failed' ? (
        <Button label="دانلود" onPress={onStartBase} size="md" variant="soft" />
      ) : working ? (
        <Button label="توقف" onPress={onPause} size="md" variant="soft" />
      ) : (
        <Button label="مدیریت" onPress={() => router.push('/map-offline')} size="md" variant="ghost" />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: AppTheme.colors.background, flex: 1 },
  centered: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.background,
    flex: 1,
    gap: 14,
    justifyContent: 'center',
  },
  loadingText: { color: AppTheme.colors.textSecondary, fontSize: 14 },
  content: { gap: 16, padding: 24, paddingBottom: 40 },
  header: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 12,
    paddingTop: 8,
  },
  headerCopy: { flex: 1 },
  eyebrow: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'right',
  },
  greeting: {
    color: AppTheme.colors.textStrong,
    fontFamily: Estedad.extraBold,
    fontSize: 24,
    lineHeight: 34,
    textAlign: 'right',
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.primarySoft,
    borderRadius: Radius.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  avatarInitials: {
    color: AppTheme.colors.primaryStrong,
    fontFamily: Estedad.bold,
    fontSize: 17,
  },
  unitStrip: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.surface,
    borderColor: AppTheme.colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  unitDivider: {
    backgroundColor: AppTheme.colors.border,
    height: 18,
    width: 1,
  },
  unitValue: {
    color: AppTheme.colors.textBody,
    flexShrink: 1,
    fontFamily: Estedad.semiBold,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
  },
  statusRow: {
    alignItems: 'stretch',
    flexDirection: 'row-reverse',
    gap: 10,
  },
  statusCellWrap: { flex: 1 },
  statusCell: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.surface,
    borderColor: AppTheme.colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: 7,
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  statusPill: {
    alignSelf: 'center',
    maxWidth: '100%',
  },
  statusCellLabel: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  pressedTile: { opacity: 0.82 },
  shiftHead: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 10,
  },
  shiftTitle: {
    color: AppTheme.colors.textStrong,
    fontFamily: Estedad.bold,
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'right',
  },
  shiftMeta: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'right',
  },
  syncRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 8,
  },
  syncText: {
    color: AppTheme.colors.textSecondary,
    flex: 1,
    fontFamily: Estedad.regular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
  },
  heroCta: { marginTop: 4 },
  heroHint: {
    alignSelf: 'center',
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: -8,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
  },
  tile: {
    backgroundColor: AppTheme.colors.surface,
    borderColor: AppTheme.colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexGrow: 1,
    flexBasis: '47%',
    gap: 6,
    padding: 14,
  },
  tileTop: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  tileIcon: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.primarySoft,
    borderRadius: Radius.sm,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  tileLabel: {
    color: AppTheme.colors.textStrong,
    fontFamily: Estedad.semiBold,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'right',
  },
  tileCaption: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 11.5,
    lineHeight: 18,
    textAlign: 'right',
  },
  mapCard: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.surface,
    borderColor: AppTheme.colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: 12,
    padding: 14,
  },
  mapCardCopy: { flex: 1, gap: 6 },
  mapCardHead: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 7,
  },
  mapCardTitle: {
    color: AppTheme.colors.textStrong,
    fontFamily: Estedad.semiBold,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'right',
  },
  mapCardBody: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'right',
  },
  mapProgressTrack: {
    backgroundColor: AppTheme.colors.surfaceSunken,
    borderRadius: 3,
    height: 5,
    overflow: 'hidden',
  },
  mapProgressFill: { backgroundColor: AppTheme.colors.primary, height: '100%' },
});
