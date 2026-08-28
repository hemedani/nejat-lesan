import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  pauseNationalDownload,
  removeNationalPack,
  resumeNationalDownload,
  setWifiOnlyDownloads,
  startNationalDownload,
} from '@/services/map-download';
import { estimatePack, formatBytes, MAP_TIERS } from '@/domain/map-packs';
import { useNationalMapPack } from '@/hooks/use-national-map-pack';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StatusPill } from '@/components/ui/status-pill';
import { AppIcons } from '@/constants/icon-map';
import { AppTheme, Estedad, Radius } from '@/constants/theme';

const BASE_ESTIMATE = estimatePack(MAP_TIERS.base);
const DEEP_ESTIMATE = estimatePack(MAP_TIERS.deep);

export default function MapOfflineScreen() {
  const router = useRouter();
  const { pack, wifiOnly, reload } = useNationalMapPack(500);

  const progress =
    pack && pack.tilesTotal > 0
      ? Math.min(100, Math.round((pack.tilesDone / pack.tilesTotal) * 100))
      : 0;
  const isBaseDone = pack?.status === 'done' && pack.zoomMax < MAP_TIERS.deep.zoomMax;
  const isWorking = pack?.status === 'queued' || pack?.status === 'downloading';

  async function handleToggleWifiOnly(value: boolean) {
    await setWifiOnlyDownloads(value);
    reload();
  }

  function confirmDeepUpgrade() {
    Alert.alert(
      'دریافت نسخه کامل',
      `حدود ${formatBytes(DEEP_ESTIMATE.estimatedBytes)} داده اضافه می‌شود. ادامه می‌دهید؟`,
      [
        { style: 'cancel', text: 'انصراف' },
        {
          onPress: () => void startNationalDownload('deep').then(reload),
          text: 'ادامه',
        },
      ],
    );
  }

  function confirmDelete() {
    Alert.alert('حذف نقشه ذخیره‌شده', 'تمام کاشی‌های دانلودشده از حافظه دستگاه پاک می‌شود.', [
      { style: 'cancel', text: 'انصراف' },
      {
        onPress: () => void removeNationalPack().then(reload),
        style: 'destructive',
        text: 'حذف',
      },
    ]);
  }

  const statusPill = !pack
    ? null
    : isWorking
      ? { label: `در حال دانلود ${progress.toLocaleString('fa-IR')}٪`, tone: 'info' as const }
      : pack.status === 'paused'
        ? ({ label: 'متوقف شده', tone: 'warning' as const })
        : pack.status === 'failed'
          ? ({ label: 'ناموفق', tone: 'danger' as const })
          : ({ label: 'آماده', tone: 'success' as const });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader onBack={() => router.back()} title="نقشه آفلاین" />
      <ScrollView contentContainerStyle={styles.content}>
        <Card variant="default">
          <CardHeader
            action={statusPill ? <StatusPill dot {...statusPill} /> : undefined}
            icon={AppIcons.home.offlinePack.name}
            title="نقشه سراسری ایران"
          />

          {!pack ? (
            <>
              <Text style={styles.body}>
                نسخه پایه کل کشور را برای استفاده بدون اینترنت ذخیره کنید.
              </Text>
              <InfoRow label="حجم تقریبی" value={formatBytes(BASE_ESTIMATE.estimatedBytes)} />
              <InfoRow label="تعداد کاشی‌ها" value={BASE_ESTIMATE.tilesTotal.toLocaleString('fa-IR')} />
              <Button
                fullWidth
                icon="cloud-download"
                label="دانلود نسخه پایه"
                onPress={() => void startNationalDownload('base').then(reload)}
                size="lg"
                style={styles.ctaGap}
              />
            </>
          ) : null}

          {pack && isWorking ? (
            <>
              <Text style={styles.body}>
                در حال دانلود {pack.tilesDone.toLocaleString('fa-IR')} از{' '}
                {pack.tilesTotal.toLocaleString('fa-IR')} کاشی · {formatBytes(pack.bytesDone)}
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Button
                fullWidth
                icon="pause"
                label="توقف دانلود"
                onPress={() => void pauseNationalDownload().then(reload)}
                variant="soft"
              />
            </>
          ) : null}

          {pack?.status === 'paused' ? (
            <>
              <Text style={styles.body}>
                دانلود متوقف شد؛ {pack.tilesDone.toLocaleString('fa-IR')} از{' '}
                {pack.tilesTotal.toLocaleString('fa-IR')} کاشی آماده است.
              </Text>
              {pack.error ? <StatusPill dot label={pack.error} style={styles.selfStart} tone="warning" /> : null}
              <Button
                fullWidth
                icon="play"
                label="ادامه دانلود"
                onPress={() => void resumeNationalDownload().then(reload)}
                size="lg"
              />
            </>
          ) : null}

          {pack?.status === 'failed' ? (
            <>
              <Text style={styles.errorText}>{pack.error ?? 'دانلود ناموفق بود.'}</Text>
              <Button
                fullWidth
                icon="refresh"
                label="تلاش دوباره"
                onPress={() => void resumeNationalDownload().then(reload)}
                size="lg"
              />
            </>
          ) : null}

          {pack?.status === 'done' ? (
            <>
              <View style={styles.doneRow}>
                <Icon name="checkmark-circle" color={AppTheme.status.success.text} size={20} />
                <Text style={styles.doneText}>
                  نقشه آفلاین آماده است · {formatBytes(pack.bytesDone)}
                </Text>
              </View>
              {isBaseDone ? (
                <Button
                  fullWidth
                  icon="add-circle-outline"
                  label={`دریافت نسخه کامل (${formatBytes(DEEP_ESTIMATE.estimatedBytes)})`}
                  onPress={confirmDeepUpgrade}
                  variant="soft"
                />
              ) : null}
            </>
          ) : null}

          {pack && !isWorking ? (
            <Button
              fullWidth
              icon="trash"
              label="حذف نقشه ذخیره‌شده"
              onPress={confirmDelete}
              variant="ghost"
            />
          ) : null}
        </Card>

        <Card variant="default">
          <View style={styles.switchRow}>
            <View style={styles.switchCopy}>
              <Text style={styles.rowLabel}>دانلود فقط با وای‌فای</Text>
              <Text style={styles.hint}>
                با داده موبایل دانلود نمی‌شود مگر این گزینه خاموش باشد.
              </Text>
            </View>
            <Switch
              accessibilityRole="switch"
              accessibilityState={{ checked: wifiOnly }}
              ios_backgroundColor={AppTheme.colors.borderStrong}
              onValueChange={value => void handleToggleWifiOnly(value)}
              trackColor={{ false: AppTheme.colors.borderStrong, true: AppTheme.colors.primary }}
              value={wifiOnly}
            />
          </View>
        </Card>

        <Text style={styles.footerNote}>
          منبع نقشه: © OpenStreetMap contributors — در حالت پرواز، کاشی‌های ذخیره‌شده بدون اینترنت
          نمایش داده می‌شوند و نواحی بدون کاشی خالی می‌مانند.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: AppTheme.colors.background, flex: 1 },
  content: { gap: 14, padding: 20, paddingBottom: 40 },
  body: {
    color: AppTheme.colors.textBody,
    fontFamily: Estedad.regular,
    fontSize: 13.5,
    lineHeight: 22,
    textAlign: 'right',
  },
  ctaGap: { marginTop: 4 },
  progressTrack: {
    backgroundColor: AppTheme.colors.surfaceSunken,
    borderRadius: Radius.pill,
    height: 8,
    overflow: 'hidden',
  },
  progressFill: { backgroundColor: AppTheme.colors.primary, borderRadius: Radius.pill, height: '100%' },
  selfStart: { alignSelf: 'flex-start' },
  doneRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 8,
  },
  doneText: {
    color: AppTheme.status.success.text,
    fontFamily: Estedad.semiBold,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'right',
  },
  errorText: {
    color: AppTheme.status.danger.text,
    fontFamily: Estedad.regular,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    minHeight: 30,
  },
  infoLabel: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  infoValue: {
    color: AppTheme.colors.textStrong,
    fontFamily: Estedad.semiBold,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'left',
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 48,
  },
  switchCopy: { flex: 1, gap: 2 },
  rowLabel: {
    color: AppTheme.colors.textStrong,
    fontFamily: Estedad.semiBold,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'right',
  },
  hint: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'right',
  },
  footerNote: {
    color: AppTheme.colors.textFaint,
    fontFamily: Estedad.regular,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'right',
  },
});
