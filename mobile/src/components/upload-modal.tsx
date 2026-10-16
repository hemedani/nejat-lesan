import { ActivityIndicator, Modal as RNModal, StyleSheet, Text, View } from 'react-native';

import { AppIcons } from '@/constants/icon-map';
import { AppTheme, Estedad, Radius } from '@/constants/theme';
import { toPersianDigits } from '@/domain/jalali';
import type { UploadProgress } from '@/domain/upload-events';

import { Button } from './ui/button';
import { Icon } from './ui/icon';

/**
 * What the officer watches while their report's files go to the server.
 *
 * This is a full-screen takeover on purpose. Over station wi-fi a five-file report is a
 * couple of minutes of nothing happening, and the honest thing is to say so and show the
 * work — a toast that expires, or a spinner on a button that used to be «ثبت گزارش», both
 * read as a freeze.
 *
 * The component sequences nothing. It renders a `UploadProgress` — a value the reducer
 * folded out of the worker's events — and reports the officer's three answers upwards.
 * Everything about *what happens next* lives in `use-report-upload`, and everything about
 * *when a file has arrived* lives in the upload pass. A component that decided any of that
 * would be a second copy of the rules, and rules that exist twice drift.
 */

export type UploadModalProps = {
  visible: boolean;
  progress: UploadProgress;
  /** «در پس‌زمینه ادامه می‌دهد» — hide the modal and let the queue carry on. */
  onDismiss?: () => void;
  onRetry: () => void;
  onSkipFailed: () => void;
  onCancel: () => void;
  /** «بستن» on a finished run. */
  onClose: () => void;
};

const PHASE_TITLES: Record<UploadProgress['phase'], string> = {
  planning: 'در حال آماده‌سازی',
  uploading: 'در حال ارسال فایل‌ها',
  linking: 'در حال اتصال فایل‌ها به گزارش',
  submitting: 'در حال ثبت گزارش',
  attention: 'ارسال بعضی فایل‌ها انجام نشد',
  done: 'گزارش ثبت شد',
  failed: 'ارسال گزارش انجام نشد',
};

export function UploadModal({
  visible,
  progress,
  onDismiss,
  onRetry,
  onSkipFailed,
  onCancel,
  onClose,
}: UploadModalProps) {
  const busy = progress.phase === 'planning' || progress.phase === 'uploading' ||
    progress.phase === 'linking' || progress.phase === 'submitting';
  const settled = progress.phase === 'done' || progress.phase === 'failed';

  return (
    <RNModal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.scrim}>
        <View accessibilityViewIsModal style={styles.sheet}>
          <Text style={styles.title}>{PHASE_TITLES[progress.phase]}</Text>

          {progress.phase === 'attention' ? (
            <AttentionBody progress={progress} />
          ) : settled ? (
            <SettledBody progress={progress} />
          ) : (
            <WorkingBody progress={progress} />
          )}

          <View style={styles.actions}>
            {progress.phase === 'attention' ? (
              <>
                <Button fullWidth label="تلاش دوباره" onPress={onRetry} size="lg" />
                <Button
                  fullWidth
                  label="ادامه بدون این فایل"
                  onPress={onSkipFailed}
                  size="lg"
                  variant="outline"
                />
                <Button fullWidth label="انصراف" onPress={onCancel} size="lg" variant="ghost" />
              </>
            ) : settled ? (
              <Button fullWidth label="بستن" onPress={onClose} size="lg" />
            ) : onDismiss ? (
              <Button
                fullWidth
                label="ادامه در پس‌زمینه"
                onPress={onDismiss}
                size="lg"
                variant="soft"
              />
            ) : null}
          </View>

          {busy ? (
            <View style={styles.busyHint}>
              <Text style={styles.hint}>
                صفحه را نبندید؛ ارسال فایل‌ها پس از بستن صفحه هم از سر گرفته می‌شود.
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </RNModal>
  );
}

/** The sweep in flight: a bar, the counter, and which file is going right now. */
function WorkingBody({ progress }: { progress: UploadProgress }) {
  return (
    <View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${progress.percent}%` }]} />
      </View>
      <View style={styles.counterRow}>
        <Text style={styles.counter}>
          {toPersianDigits(progress.done)} از {toPersianDigits(progress.total)}
        </Text>
        <Text style={styles.percent}>{toPersianDigits(progress.percent)}٪</Text>
      </View>
      <View style={styles.currentRow}>
        <ActivityIndicator color={AppTheme.colors.primary} size="small" />
        <Text numberOfLines={1} style={styles.current}>
          {progress.current ?? 'در حال آماده‌سازی فایل‌ها…'}
        </Text>
      </View>
    </View>
  );
}

/**
 * A file did not make it, and this is the only moment the officer can still say so.
 *
 * Nothing is decided on their behalf: the report is not filed behind their back and no
 * file is quietly dropped. Each failure is named with the reason, because "some files
 * failed" is not something an officer can act on.
 */
function AttentionBody({ progress }: { progress: UploadProgress }) {
  return (
    <View>
      <Text style={styles.body}>
        {toPersianDigits(progress.failed.length)} فایل ارسال نشد. می‌توانید دوباره تلاش کنید، بدون
        آن‌ها گزارش را ثبت کنید، یا منصرف شوید.
      </Text>
      {progress.failed.map(entry => (
        <View key={entry.mediaId} style={styles.failedRow}>
          <Icon color={AppTheme.status.danger.text} name={AppIcons.status.failed.name} size={18} />
          <View style={styles.failedText}>
            <Text numberOfLines={1} style={styles.failedName}>
              {entry.name}
            </Text>
            <Text style={styles.failedReason}>{entry.reason}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function SettledBody({ progress }: { progress: UploadProgress }) {
  const ok = progress.phase === 'done';
  return (
    <View style={styles.settledBody}>
      <View
        style={[
          styles.settledBadge,
          {
            backgroundColor: ok ? AppTheme.status.success.bg : AppTheme.status.danger.bg,
            borderColor: ok ? AppTheme.status.success.border : AppTheme.status.danger.border,
          },
        ]}
      >
        <Icon
          color={ok ? AppTheme.status.success.text : AppTheme.status.danger.text}
          name={ok ? AppIcons.status.synced.name : AppIcons.status.failed.name}
          size={28}
        />
      </View>
      <Text style={styles.body}>
        {ok
          ? 'گزارش و فایل‌های آن با موفقیت ثبت شد.'
          : (progress.reason ?? 'ارسال انجام نشد. گزارش در پیش‌نویس‌ها باقی ماند.')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    backgroundColor: AppTheme.colors.overlayScrim,
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: AppTheme.colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    gap: 18,
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  title: {
    color: AppTheme.colors.textStrong,
    fontFamily: Estedad.bold,
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'center',
  },
  body: {
    color: AppTheme.colors.textBody,
    fontFamily: Estedad.regular,
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'center',
  },
  barTrack: {
    backgroundColor: AppTheme.colors.surfaceSunken,
    borderRadius: Radius.pill,
    height: 10,
    overflow: 'hidden',
  },
  barFill: {
    backgroundColor: AppTheme.colors.primary,
    borderRadius: Radius.pill,
    height: '100%',
  },
  counterRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  counter: {
    color: AppTheme.colors.primaryStrong,
    fontFamily: Estedad.semiBold,
    fontSize: 14,
  },
  percent: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.medium,
    fontSize: 13,
  },
  currentRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 10,
    marginTop: 16,
  },
  current: {
    color: AppTheme.colors.textBody,
    flex: 1,
    fontFamily: Estedad.medium,
    fontSize: 14,
  },
  failedRow: {
    alignItems: 'flex-start',
    backgroundColor: AppTheme.status.danger.bg,
    borderColor: AppTheme.status.danger.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: 10,
    marginTop: 8,
    padding: 12,
  },
  failedText: {
    flex: 1,
    gap: 2,
  },
  failedName: {
    color: AppTheme.colors.textStrong,
    fontFamily: Estedad.semiBold,
    fontSize: 13,
  },
  failedReason: {
    color: AppTheme.status.danger.text,
    fontFamily: Estedad.regular,
    fontSize: 12,
    lineHeight: 20,
  },
  settledBody: {
    alignItems: 'center',
    gap: 12,
  },
  settledBadge: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  actions: {
    gap: 10,
  },
  busyHint: {
    alignItems: 'center',
  },
  hint: {
    color: AppTheme.colors.textFaint,
    fontFamily: Estedad.regular,
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'center',
  },
});