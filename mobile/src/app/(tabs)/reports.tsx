import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchMyReports } from '@/api/accident';
import { ApiError } from '@/api/errors';
import type { MyReport } from '@/api/accident';
import { markDraftReturned } from '@/domain/draft-actions';
import type { AccidentDraft } from '@/domain/types';
import { listDrafts } from '@/storage/local-database';
import { Button } from '@/components/ui/button';
import { Banner } from '@/components/ui/banner';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { SkeletonList } from '@/components/ui/skeleton';
import { StatusPill, type StatusPillProps } from '@/components/ui/status-pill';
import { AppIcons, type IconName } from '@/constants/icon-map';
import { AppTheme, Estedad, Radius } from '@/constants/theme';
import { useRequiredSession } from '@/auth/use-required-session';

type ReviewStatus = NonNullable<MyReport['review_status']>;
type FilterKey = 'all' | ReviewStatus;

const SYNC_LABELS: Record<NonNullable<MyReport['sync_status']>, string> = {
  draft: 'پیش‌نویس',
  queued: 'در صف ارسال',
  syncing: 'در حال ارسال',
  synced: 'ارسال‌شده',
  rejected: 'ردشده',
};

const REVIEW_LABELS: Record<ReviewStatus, string> = {
  submitted: 'ارسال‌شده به مرکز',
  under_review: 'در حال بررسی',
  returned: 'بازگشت برای اصلاح',
  approved: 'تأییدشده',
  completed: 'تکمیل‌شده',
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'همه' },
  { key: 'submitted', label: REVIEW_LABELS.submitted },
  { key: 'under_review', label: REVIEW_LABELS.under_review },
  { key: 'approved', label: REVIEW_LABELS.approved },
  { key: 'returned', label: REVIEW_LABELS.returned },
];

const REVIEW_TONES: Record<ReviewStatus, { tone: StatusPillProps['tone']; icon?: IconName }> = {
  submitted: { tone: 'neutral' },
  under_review: { tone: 'info', icon: 'time-outline' },
  returned: { tone: 'warning', icon: 'warning-outline' },
  approved: { tone: 'success', icon: 'checkmark-circle' },
  completed: { tone: 'success', icon: 'checkmark-circle' },
};

export default function ReportsScreen() {
  const router = useRouter();
  const session = useRequiredSession();
  const [reports, setReports] = useState<MyReport[] | null>(null);
  const [localUuids, setLocalUuids] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');

  const reload = useCallback(async () => {
    if (!session) {
      return;
    }
    try {
      const serverReports = await fetchMyReports(session, { page: 1, limit: 50 });
      setReports(serverReports);
      setError(null);
      const drafts = await listDrafts();
      setLocalUuids(new Set(drafts.map((draft: AccidentDraft) => draft.client_report_uuid)));
    } catch (loadError) {
      setError(
        loadError instanceof ApiError && loadError.code === 'offline'
          ? 'بدون اینترنت؛ پس از اتصال، گزارش‌های سرور نمایش داده می‌شوند.'
          : 'بارگیری گزارش‌ها انجام نشد.',
      );
    }
  }, [session]);

  useEffect(() => {
    if (!session) {
      return;
    }
    let cancelled = false;
    fetchMyReports(session, { page: 1, limit: 50 })
      .then(serverReports => {
        if (!cancelled) {
          setReports(serverReports);
          setError(null);
        }
      })
      .catch(loadError => {
        if (!cancelled) {
          setError(
            loadError instanceof ApiError && loadError.code === 'offline'
              ? 'بدون اینترنت؛ پس از اتصال، گزارش‌های سرور نمایش داده می‌شوند.'
              : 'بارگیری گزارش‌ها انجام نشد.',
          );
        }
      });
    listDrafts().then(drafts => {
      if (!cancelled) {
        setLocalUuids(new Set(drafts.map((draft: AccidentDraft) => draft.client_report_uuid)));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [session]);

  async function handleRefresh() {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }

  const visible =
    reports == null ? null : reports.filter(report => filter === 'all' || report.review_status === filter);

  const isOfflineError =
    error != null && error.startsWith('بدون اینترنت');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            colors={[AppTheme.colors.primary]}
            tintColor={AppTheme.colors.primary}
          />
        }
      >
        <Text style={styles.title}>گزارش‌های من</Text>

        <View style={styles.filterRow}>
          {FILTERS.map(item => (
            <PressableChip
              active={filter === item.key}
              key={item.key}
              label={item.label}
              onPress={() => setFilter(item.key)}
            />
          ))}
        </View>

        {!session ? null : reports === null && error != null ? (
          <Banner
            actionLabel={isOfflineError ? undefined : 'تلاش دوباره'}
            icon={isOfflineError ? AppIcons.status.offline.name : AppIcons.status.error.name}
            message={error}
            onAction={() => void reload()}
            tone={isOfflineError ? 'neutral' : 'danger'}
          />
        ) : reports === null ? (
          <SkeletonList rows={4} rowHeight={110} />
        ) : visible != null && visible.length === 0 ? (
          <EmptyState
            actionLabel="مشاهده پیش‌نویس‌ها"
            description={
              filter === 'all'
                ? 'پیش‌نویس‌های ارسال‌شده و وضعیت بررسی آن‌ها در این بخش نمایش داده می‌شود.'
                : 'گزارشی با این وضعیت پیدا نشد؛ فیلتر دیگری را امتحان کنید.'
            }
            icon={AppIcons.home.myReports.name}
            onAction={() => router.push('/drafts')}
            title="گزارشی یافت نشد"
          />
        ) : (
          visible?.map(report => {
            const isReturned = report.review_status === 'returned' || report.sync_status === 'rejected';
            const hasLocalDraft =
              report.client_report_uuid != null && localUuids.has(report.client_report_uuid);
            const dateLabel = report.date_of_accident ?? report.reported_at;
            const review = report.review_status ? REVIEW_TONES[report.review_status] : null;
            return (
              <Card key={report._id} style={[styles.cardGap, isReturned && styles.cardReturned]}>
                <View style={styles.cardHeader}>
                  <View style={styles.reportIdRow}>
                    <Icon color={AppTheme.colors.textSecondary} name="document-text" size={15} />
                    <Text style={styles.reportId}>{report.report_id ?? report._id.slice(-8)}</Text>
                  </View>
                  {dateLabel ? <Text style={styles.date}>{new Date(dateLabel).toLocaleString('fa-IR')}</Text> : null}
                </View>

                <View style={styles.chipRow}>
                  {report.sync_status ? (
                    <StatusPill dot label={SYNC_LABELS[report.sync_status]} tone={report.sync_status === 'synced' ? 'success' : report.sync_status === 'rejected' ? 'danger' : 'neutral'} />
                  ) : null}
                  {review && report.review_status ? (
                    <StatusPill icon={review.icon} label={REVIEW_LABELS[report.review_status]} tone={review.tone} />
                  ) : null}
                </View>

                {report.rejection_reason ? (
                  <Banner message={`یادداشت کارشناس: ${report.rejection_reason}`} tone="danger" />
                ) : null}

                {isReturned && hasLocalDraft && report.client_report_uuid ? (
                  <Button
                    fullWidth
                    icon={AppIcons.map.editLocation.name}
                    label="اصلاح گزارش"
                    onPress={() => {
                      const uuid = report.client_report_uuid as string;
                      void markDraftReturned(uuid, report.rejection_reason ?? undefined)
                        .catch(() => undefined)
                        .then(() =>
                          router.push({
                            pathname: '/incident/details',
                            params: { uuid },
                          }),
                        );
                    }}
                    size="md"
                    variant="soft"
                  />
                ) : null}
                {isReturned && !hasLocalDraft ? (
                  <Text style={styles.missingDraft}>پیش‌نویس محلی برای این گزارش یافت نشد.</Text>
                ) : null}
              </Card>
            );
          })
        )}

        <Text style={styles.hint}>برای به‌روزرسانی فهرست، صفحه را به پایین بکشید.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function PressableChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Text
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.filterChip, active && styles.filterChipActive]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: AppTheme.colors.background, flex: 1 },
  content: { gap: 14, padding: 20, paddingBottom: 40 },
  title: {
    color: AppTheme.colors.textStrong,
    fontFamily: Estedad.extraBold,
    fontSize: 24,
    lineHeight: 34,
    textAlign: 'right',
  },
  filterRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    backgroundColor: AppTheme.colors.surface,
    borderColor: AppTheme.colors.borderStrong,
    borderRadius: Radius.pill,
    borderWidth: 1,
    color: AppTheme.colors.textBody,
    fontFamily: Estedad.medium,
    fontSize: 12.5,
    lineHeight: 19,
    minHeight: 40,
    overflow: 'hidden',
    paddingHorizontal: 13,
    paddingVertical: 10,
    textAlign: 'center',
  },
  filterChipActive: {
    backgroundColor: AppTheme.colors.primarySoft,
    borderColor: AppTheme.colors.primaryBorder,
    color: AppTheme.colors.primaryStrong,
  },
  cardGap: { gap: 10 },
  cardReturned: { borderColor: AppTheme.status.warning.border },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  reportIdRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 7,
  },
  reportId: {
    color: AppTheme.colors.textStrong,
    fontFamily: Estedad.bold,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'left',
  },
  date: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 11.5,
    lineHeight: 17,
  },
  chipRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  missingDraft: {
    color: AppTheme.status.warning.deep,
    fontFamily: Estedad.regular,
    fontSize: 12.5,
    lineHeight: 20,
    textAlign: 'right',
  },
  hint: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 11.5,
    lineHeight: 18,
    textAlign: 'center',
  },
});
