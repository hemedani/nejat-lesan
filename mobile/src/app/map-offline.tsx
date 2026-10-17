import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AREA_RADII_KM, estimateAreaPack } from '@/domain/map-area-pack';
import { formatBytes, MAP_TIERS, estimatePack } from '@/domain/map-packs';
import { organizationPoint } from '@/domain/organization';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StatusPill } from '@/components/ui/status-pill';
import { AppIcons } from '@/constants/icon-map';
import { AppTheme, Estedad, Radius } from '@/constants/theme';
import { useMapPacks } from '@/hooks/use-map-packs';
import { useRequiredSession } from '@/auth/use-required-session';
import {
  pauseDownload,
  removePack,
  resumeDownload,
  setWifiOnlyDownloads,
  startAreaDownload,
  startNationalDownload,
  type MapPackView,
} from '@/services/map-download';

const BASE_ESTIMATE = estimatePack(MAP_TIERS.base);
const DEEP_ESTIMATE = estimatePack(MAP_TIERS.deep);

const NATIONAL_ID = 'national';
const AREA_ID = 'area';

export default function MapOfflineScreen() {
  const router = useRouter();
  const session = useRequiredSession();
  const { packs, wifiOnly, reload } = useMapPacks(500);

  const national = packs.find(pack => pack.id === NATIONAL_ID) ?? null;
  const area = packs.find(pack => pack.id === AREA_ID) ?? null;

  const organization = session?.primaryOrganization ?? null;
  const center = useMemo(() => organizationPoint(organization), [organization]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader onBack={() => router.back()} title="نقشه آفلاین" />
      <ScrollView contentContainerStyle={styles.content}>
        <PackCard
          body={
            <>
              <Text style={styles.body}>
                محدوده فعالیت سازمان شما تا بزرگ‌نمایی ۱۷ ذخیره می‌شود؛ دقیقاً همان سطحی که
                انتخاب محل حادثه به آن نیاز دارد.
              </Text>
              <RadiusPicker center={center} onDone={reload} />
            </>
          }
          icon={AppIcons.map.pinIncident.name}
          pack={area}
          title="محدوده سازمان"
        />

        <PackCard
          body={
            <>
              {!national ? (
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

              {national?.status === 'done' && national.zoomMax < MAP_TIERS.deep.zoomMax ? (
                <Button
                  fullWidth
                  icon="add-circle-outline"
                  label={`دریافت نسخه کامل (${formatBytes(DEEP_ESTIMATE.estimatedBytes)})`}
                  onPress={() => {
                    Alert.alert('دریافت نسخه کامل', `حدود ${formatBytes(DEEP_ESTIMATE.estimatedBytes)} داده اضافه می‌شود. ادامه می‌دهید؟`, [
                      { style: 'cancel', text: 'انصراف' },
                      { onPress: () => void startNationalDownload('deep').then(reload), text: 'ادامه' },
                    ]);
                  }}
                  variant="soft"
                />
              ) : null}
            </>
          }
          icon={AppIcons.home.offlinePack.name}
          pack={national}
          title="نقشه سراسری ایران"
        />

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
              onValueChange={value => void setWifiOnlyDownloads(value).then(reload)}
              trackColor={{ false: AppTheme.colors.borderStrong, true: AppTheme.colors.primary }}
              value={wifiOnly}
            />
          </View>
        </Card>

        <Text style={styles.footerNote}>
          منبع نقشه: © OpenStreetMap contributors — در حالت پرواز، کاشی‌های ذخیره‌شده بدون اینترنت
          نمایش داده می‌شوند و نواحی خارج از محدوده دانلودشده با طرح راهنما مشخص می‌شوند.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Radius presets for the org box, with a real per-preset size estimate. */
function RadiusPicker({ center, onDone }: { center: ReturnType<typeof organizationPoint>; onDone: () => void }) {
  const [pending, setPending] = useState<string | null>(null);

  if (!center) {
    return (
      <View style={styles.noCenterRow}>
        <Icon color={AppTheme.status.warning.text} name="alert-circle-outline" size={16} />
        <Text style={styles.noCenterText}>
          مرکز سازمان ثبت نشده است؛ برای دانلود محدوده، مرکز سازمان را در پنل مدیریت وارد کنید.
        </Text>
      </View>
    );
  }

  async function start(km: number, label: string) {
    setPending(label);
    try {
      const refusal = await startAreaDownload(center, km);
      if (refusal) {
        Alert.alert('دانلود محدوده', refusal);
      }
      onDone();
    } finally {
      setPending(null);
    }
  }

  return (
    <View style={styles.pickerBlock}>
      {AREA_RADII_KM.map(preset => {
        const estimate = estimateAreaPack(center, preset.km);
        const busy = pending === preset.label;
        return (
          <Pressable
            key={preset.km}
            accessibilityRole="button"
            accessibilityState={{ disabled: pending != null }}
            disabled={pending != null}
            onPress={() => void start(preset.km, preset.label)}
            style={({ pressed }) => [styles.preset, pressed && styles.presetPressed]}
          >
            <View style={styles.presetCopy}>
              <Text style={styles.presetLabel}>{preset.label}</Text>
              <Text style={styles.presetMeta}>
                {estimate.tilesTotal.toLocaleString('fa-IR')} کاشی ·{' '}
                {formatBytes(estimate.estimatedBytes)}
              </Text>
            </View>
            {busy ? (
              <Text style={styles.presetPending}>در حال شروع…</Text>
            ) : (
              <Icon color={AppTheme.colors.primary} name="cloud-download-outline" size={18} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

function PackCard({
  body,
  icon,
  pack,
  title,
}: {
  body: React.ReactNode;
  icon: import('@/constants/icon-map').IconName;
  pack: MapPackView | null;
  title: string;
}) {
  const progress =
    pack && pack.tilesTotal > 0
      ? Math.min(100, Math.round((pack.tilesDone / pack.tilesTotal) * 100))
      : 0;
  const isWorking = pack?.status === 'queued' || pack?.status === 'downloading';

  const statusPill = !pack
    ? null
    : isWorking
      ? { label: `در حال دانلود ${progress.toLocaleString('fa-IR')}٪`, tone: 'info' as const }
      : pack.status === 'paused'
        ? { label: 'متوقف شده', tone: 'warning' as const }
        : pack.status === 'failed'
          ? { label: 'ناموفق', tone: 'danger' as const }
          : pack.status === 'idle'
            ? { label: 'شروع نشده', tone: 'neutral' as const }
            : { label: 'آماده', tone: 'success' as const };

  return (
    <Card variant="default">
      <CardHeader
        action={statusPill ? <StatusPill dot {...statusPill} /> : undefined}
        icon={icon}
        title={title}
      />

      {body}

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
            onPress={() => void pauseDownload(pack.id)}
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
            onPress={() => void resumeDownload(pack.id)}
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
            onPress={() => void resumeDownload(pack.id)}
            size="lg"
          />
        </>
      ) : null}

      {pack?.status === 'done' ? (
        <View style={styles.doneRow}>
          <Icon color={AppTheme.status.success.text} name="checkmark-circle" size={20} />
          <Text style={styles.doneText}>
            آماده است · تا بزرگ‌نمایی {pack.zoomMax.toLocaleString('fa-IR')} · {formatBytes(pack.bytesDone)}
          </Text>
        </View>
      ) : null}

      {pack && !isWorking ? (
        <Button
          fullWidth
          icon="trash"
          label="حذف این بخش"
          onPress={() =>
            Alert.alert(
              'حذف بخش دانلودشده',
              pack.id === NATIONAL_ID
                ? 'تمام کاشی‌های دانلودشده از حافظه دستگاه پاک می‌شود.'
                : 'این بخش از حافظه حذف می‌شود؛ کاشی‌های سراسری دست‌نخورده می‌مانند.',
              [
                { style: 'cancel', text: 'انصراف' },
                { onPress: () => void removePack(pack.id), style: 'destructive', text: 'حذف' },
              ],
            )
          }
          variant="ghost"
        />
      ) : null}
    </Card>
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
  noCenterRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 8,
  },
  noCenterText: {
    color: AppTheme.status.warning.text,
    flex: 1,
    fontFamily: Estedad.regular,
    fontSize: 12.5,
    lineHeight: 20,
    textAlign: 'right',
  },
  pickerBlock: { gap: 8, marginTop: 10 },
  preset: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.surfaceMuted,
    borderColor: AppTheme.colors.border,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row-reverse',
    gap: 10,
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  presetPressed: { backgroundColor: AppTheme.colors.primarySoft },
  presetCopy: { flex: 1, gap: 2 },
  presetLabel: {
    color: AppTheme.colors.textStrong,
    fontFamily: Estedad.semiBold,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'right',
  },
  presetMeta: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
  },
  presetPending: {
    color: AppTheme.colors.primary,
    fontFamily: Estedad.medium,
    fontSize: 11.5,
  },
});