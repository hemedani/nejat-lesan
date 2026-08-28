import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { SyncStatus } from '@/domain/types';
import {
  canManuallyRetry,
  loadDraftBoard,
  requeueDraft,
  type DraftBoardItem,
} from '@/domain/draft-actions';
import { getSyncWorker } from '@/services/sync-worker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SkeletonList } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { AppIcons } from '@/constants/icon-map';
import { AppTheme, Estedad, Radius, type StatusTone } from '@/constants/theme';

type PillTone = StatusTone | 'primary';

const STATUS_TONES: Record<SyncStatus, PillTone> = {
  draft: 'neutral',
  queued: 'info',
  syncing: 'primary',
  synced: 'success',
  rejected: 'danger',
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fa-IR');
}

export default function DraftsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<DraftBoardItem[] | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(async () => {
    const board = await loadDraftBoard();
    setItems(board);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      loadDraftBoard().then(board => {
        if (!cancelled) {
          setItems(board);
        }
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  async function handleRetry(item: DraftBoardItem) {
    await requeueDraft(item.draft.client_report_uuid);
    await reload();
    void getSyncWorker().run(true).finally(() => {
      void reload();
    });
  }

  async function handleSyncAll() {
    if (isSyncing) {
      return;
    }
    setIsSyncing(true);
    try {
      await getSyncWorker().run(true);
      await reload();
    } finally {
      setIsSyncing(false);
    }
  }

  async function handlePullRefresh() {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        action={
          <Button
            icon={AppIcons.status.syncing.name}
            label={isSyncing ? 'در حال همگام‌سازی' : 'همگام‌سازی همه'}
            loading={isSyncing}
            onPress={() => void handleSyncAll()}
            size="md"
            variant="ghost"
          />
        }
        onBack={() => router.back()}
        title="پیش‌نویس‌ها"
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handlePullRefresh()}
            colors={[AppTheme.colors.primary]}
            tintColor={AppTheme.colors.primary}
          />
        }
      >
        <Text style={styles.description}>
          پیش‌نویس‌ها روی همین دستگاه ذخیره می‌شوند و با برقراری اینترنت به‌صورت خودکار ارسال می‌شوند.
        </Text>

        {items === null ? (
          <SkeletonList rows={3} rowHeight={120} />
        ) : items.length === 0 ? (
          <EmptyState
            actionLabel="ثبت حادثه جدید"
            description="با انتخاب «ثبت حادثه جدید» در داشبورد، اولین پیش‌نویس شما ساخته می‌شود."
            icon={AppIcons.home.drafts.name}
            onAction={() => router.push('/incident')}
            title="پیش‌نویسی وجود ندارد"
          />
        ) : (
          items.map(item => {
            const status: SyncStatus = item.queue?.status ?? item.draft.sync_status;
            const retryable = canManuallyRetry(item);
            return (
              <Card key={item.draft.client_report_uuid} variant="default">
                <View style={styles.cardHeader}>
                  <StatusPill
                    dot
                    label={item.statusLabel}
                    tone={STATUS_TONES[status]}
                    icon={status === 'syncing' ? AppIcons.status.syncing.name : undefined}
                  />
                  <Text style={styles.date}>{formatDateTime(item.draft.updated_at)}</Text>
                </View>

                {item.draft.report_id ? (
                  <View style={styles.detailRow}>
                    <Icon color={AppTheme.colors.textSecondary} name="document-text" size={14} />
                    <Text style={styles.detail}>شناسه گزارش: {item.draft.report_id}</Text>
                  </View>
                ) : null}

                {item.attempts > 0 && status !== 'synced' ? (
                  <View style={styles.detailRow}>
                    <Icon color={AppTheme.colors.textSecondary} name="sync" size={14} />
                    <Text style={styles.detail}>
                      تعداد تلاش‌ها: {item.attempts.toLocaleString('fa-IR')}
                      {item.nextRetryAt && status === 'queued'
                        ? ` · تلاش بعدی ${formatDateTime(item.nextRetryAt)}`
                        : ''}
                    </Text>
                  </View>
                ) : null}

                {item.lastError ? (
                  <View style={styles.errorBox}>
                    <Icon color={AppTheme.status.danger.text} name="alert-circle" size={15} />
                    <Text style={styles.error}>{item.lastError}</Text>
                  </View>
                ) : null}

                {retryable ? (
                  <Button
                    fullWidth
                    icon={AppIcons.status.queued.name}
                    label="ارسال دوباره"
                    onPress={() => void handleRetry(item)}
                    size="md"
                    variant="soft"
                    style={styles.retryButton}
                  />
                ) : null}
              </Card>
            );
          })
        )}

        <Button
          fullWidth
          icon={AppIcons.home.registerIncident.name}
          label="ثبت حادثه جدید"
          onPress={() => router.push('/incident')}
          size="lg"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: AppTheme.colors.background, flex: 1 },
  content: { gap: 14, padding: 20, paddingBottom: 40 },
  description: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'right',
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  date: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 7,
  },
  detail: {
    color: AppTheme.colors.textBody,
    fontFamily: Estedad.regular,
    fontSize: 12.5,
    lineHeight: 19,
    textAlign: 'right',
  },
  errorBox: {
    alignItems: 'flex-start',
    backgroundColor: AppTheme.status.danger.bg,
    borderColor: AppTheme.status.danger.border,
    borderRadius: Radius.sm,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: 7,
    padding: 10,
  },
  error: {
    color: AppTheme.status.danger.text,
    flexShrink: 1,
    fontFamily: Estedad.regular,
    fontSize: 12.5,
    lineHeight: 20,
    textAlign: 'right',
  },
  retryButton: { marginTop: 4 },
});
