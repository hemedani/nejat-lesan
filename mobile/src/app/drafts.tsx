import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { SyncStatus } from '@/domain/types';
import {
  canManuallyRetry,
  loadDraftBoard,
  type DraftBoardItem,
} from '@/domain/draft-actions';
import { resumeRouteFor } from '@/domain/form-routing';
import { INCIDENT_TYPE_SHORT_LABEL, incidentTypeOf } from '@/domain/incident-type';
import { useReportUpload } from '@/hooks/use-report-upload';
import { UploadModal } from '@/components/upload-modal';
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
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(async () => {
    const board = await loadDraftBoard();
    setItems(board);
  }, []);

  const upload = useReportUpload({
    // The board re-reads `sync_status`, so whatever the run did is on screen the moment
    // it finishes — or the moment the officer lets it finish in the background.
    onSettled: () => void reload(),
  });

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
    await upload.send([item.draft.client_report_uuid]);
  }

  /**
   * The officer's way back from the station: everything captured offline, one report at a
   * time, each with a modal that names the file in flight.
   *
   * It deliberately walks the queue itself rather than asking the worker for every record
   * at once. The worker holds one report's progress in the modal at a time, so a bulk run
   * that narrated five reports at once would have the bar jumping between five file lists.
   */
  async function handleSendAll() {
    if (!items) {
      return;
    }
    const pending = items
      .filter(item => item.draft.sync_status !== 'synced')
      .map(item => item.draft.client_report_uuid);
    await upload.send(pending);
  }

  async function handlePullRefresh() {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }

  /**
   * Reopen a draft in the editor that produced it.
   *
   * The draft's own provenance picks the screen (`resumeRouteFor`), because the
   * answers stored on the device only make sense to the questions that collected
   * them — a form-filed draft reopened in the built-in wizard would show different
   * questions and overwrite the answers on the next save.
   */
  function openDraft(item: DraftBoardItem) {
    const target = resumeRouteFor(item.draft);
    const uuid = item.draft.client_report_uuid;
    if (target.pathname === '/incident/form') {
      router.push({
        pathname: '/incident/form',
        params: { definitionId: target.definitionId, uuid },
      });
      return;
    }
    router.push({ pathname: target.pathname, params: { uuid } });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        action={
          <Button
            icon={AppIcons.status.syncing.name}
            label="ارسال همه"
            loading={upload.running}
            onPress={() => void handleSendAll()}
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
          برای تکمیل یا ویرایش، روی هر پیش‌نویس بزنید.
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
              <Card
                accessibilityLabel={`باز کردن پیش‌نویس ${item.draft.report_id ?? ''}`.trim()}
                key={item.draft.client_report_uuid}
                onPress={() => openDraft(item)}
                variant="default"
              >
                <View style={styles.cardHeader}>
                  <View style={styles.pills}>
                    <StatusPill
                      dot
                      label={INCIDENT_TYPE_SHORT_LABEL[incidentTypeOf(item.draft)]}
                      tone="neutral"
                    />
                    <StatusPill
                      dot
                      label={item.statusLabel}
                      tone={STATUS_TONES[status]}
                      icon={status === 'syncing' ? AppIcons.status.syncing.name : undefined}
                    />
                  </View>
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

                {/*
                  A delivered draft is finished, not pending: its progress from here
                  happens at the control centre, and the only screen that shows it is
                  «گزارش‌های من». Without this line the row read as a stuck upload.
                */}
                {status === 'synced' ? (
                  <View style={styles.detailRow}>
                    <Icon color={AppTheme.colors.textSecondary} name="checkmark-circle" size={14} />
                    <Text style={styles.detail}>
                      به مرکز رسیده است؛ وضعیت بررسی در «گزارش‌های من» دیده می‌شود.
                    </Text>
                  </View>
                ) : null}

                {retryable ? (
                  <Button
                    fullWidth
                    icon={AppIcons.status.queued.name}
                    label="ارسال"
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

      <UploadModal
        onCancel={upload.cancel}
        onClose={upload.close}
        onDismiss={upload.dismiss}
        onRetry={upload.retry}
        onSkipFailed={upload.skipFailed}
        progress={upload.progress}
        visible={upload.visible}
      />
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
  pills: {
    flexDirection: 'row-reverse',
    gap: 6,
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
    flexShrink: 1,
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
