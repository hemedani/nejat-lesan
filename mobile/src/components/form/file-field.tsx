import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { AnswerValue } from '@forms';
import { useRequiredSession } from '@/auth/use-required-session';
import {
  ASSET_UPLOAD_LABEL,
  uploadErrorOf,
  uploadStateOf,
} from '@/domain/asset-upload-state';
import { attachAsset, listAssetsFor, removeAsset, type AssetSource } from '@/services/asset-service';
import { uploadAssetNow } from '@/services/asset-upload-now';
import type { MediaRecord } from '@/storage/local-database';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import type { IconFamily, IconName } from '@/constants/icon-map';
import { AppTheme, Estedad, Radius } from '@/constants/theme';

/**
 * A dynamic form's `file` field.
 *
 * The answer is the ordered list of **local asset ids** captured for this field,
 * and the bytes live in the report's media directory (`asset-service`). Storing
 * ids rather than the files themselves is what lets a captured photo survive
 * navigation, backgrounding and restart while staying resumable offline — the
 * upload happens later, in the sync worker.
 *
 * The media table is the source of truth for what is attached, and the answer is
 * kept in step with it. That ordering matters: `attachAsset` writes the row
 * before the answer is updated, so a kill in between leaves an asset the answer
 * does not mention — reconciling from the table recovers it instead of losing
 * the officer's evidence.
 *
 * Each row also carries its own upload state, so the officer can see whether the
 * bytes reached the centre and retry the ones that did not, without submitting
 * the whole report again. Uploading here is a convenience over the sync worker,
 * never a requirement: the bytes are already safe on the device either way.
 */

export type FileFieldProps = {
  /** The draft this field belongs to; asset bytes are keyed by it. */
  clientReportUuid: string;
  /** The field's instance path, so each field (and each repeatable row) has its own slot. */
  owner: string;
  value: AnswerValue | undefined;
  onChange: (next: AnswerValue | undefined) => void;
  hasError?: boolean;
};

const FAILURE_MESSAGES: Record<'permission_denied' | 'cancelled' | 'failed', string> = {
  permission_denied: 'دسترسی دوربین/گالری رد شد؛ از تنظیمات دستگاه مجوز دهید.',
  cancelled: '',
  failed: 'افزودن فایل انجام نشد؛ دوباره تلاش کنید.',
};

type KindIcon = { name: IconName; family?: IconFamily };

const KIND_ICON: Record<'image' | 'video' | 'doc', KindIcon> = {
  image: { name: 'image-outline' },
  video: { name: 'videocam-outline' },
  doc: { name: 'document-text-outline' },
};

const ACTIONS: { source: AssetSource; label: string; icon: KindIcon }[] = [
  { source: 'camera', label: 'دوربین', icon: { name: 'camera' } },
  { source: 'library', label: 'گالری', icon: { name: 'images' } },
  { source: 'document', label: 'فایل', icon: { name: 'document-attach-outline' } },
];

function kindOf(record: MediaRecord): 'image' | 'video' | 'doc' {
  const kind = (record.metadata as { kind?: unknown }).kind;
  if (kind === 'image' || kind === 'video' || kind === 'doc') return kind;
  // Fall back to the mime type for a record written by an older build.
  const mime = record.mime_type ?? '';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  return 'doc';
}

function fileLabel(record: MediaRecord): string {
  const name = (record.metadata as { file_name?: unknown }).file_name;
  return typeof name === 'string' && name.length > 0 ? name : record.id;
}

function formatSize(bytes: number | undefined): string {
  if (typeof bytes !== 'number' || bytes <= 0) return '';
  const kilobytes = Math.max(1, Math.round(bytes / 1024));
  if (kilobytes < 1024) return `${kilobytes.toLocaleString('fa-IR')} کیلوبایت`;
  const megabytes = Math.round((kilobytes / 1024) * 10) / 10;
  return `${megabytes.toLocaleString('fa-IR')} مگابایت`;
}

const KIND_LABEL: Record<'image' | 'video' | 'doc', string> = {
  image: 'تصویر',
  video: 'فیلم',
  doc: 'سند',
};

export function FileField({ clientReportUuid, owner, value, onChange, hasError }: FileFieldProps) {
  /** `null` means "not loaded yet" — distinct from "loaded and empty". */
  const [items, setItems] = useState<MediaRecord[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const session = useRequiredSession();

  const reload = useCallback(
    () =>
      listAssetsFor(clientReportUuid, owner)
        .then((records) => setItems(records))
        .catch(() => {
          // Keep the field in its unknown state rather than reporting an empty
          // one: an empty list would reconcile the answer to "nothing attached"
          // and clear the officer's evidence on a transient storage error.
        }),
    [clientReportUuid, owner],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  const valueKey = Array.isArray(value) ? (value as string[]).join('|') : '';

  // Reconcile the answer with what is actually on disk. The guard makes this a
  // no-op once they agree, so it cannot loop, and it is what recovers an asset
  // whose row was written just before the app was killed.
  useEffect(() => {
    if (items === null) return;
    const ids = items.map((record) => record.id);
    if (ids.join('|') === valueKey) return;
    onChange(ids.length > 0 ? ids : undefined);
  }, [items, valueKey, onChange]);

  const handleAttach = useCallback(
    async (source: AssetSource) => {
      setBusy(true);
      setError(null);
      const result = await attachAsset({ clientReportUuid, owner, source });
      setBusy(false);
      if (!result.ok) {
        const message = FAILURE_MESSAGES[result.reason];
        if (message) setError(message);
        return;
      }
      // Read the list back and write the answer straight away rather than
      // waiting for the reconcile effect: an officer who attaches a file and
      // immediately submits must not lose it to a render that has not run yet.
      const records = await listAssetsFor(clientReportUuid, owner).catch(() => null);
      if (records) {
        setItems(records);
        onChange(records.length > 0 ? records.map((record) => record.id) : undefined);
      }
    },
    [clientReportUuid, owner, onChange],
  );

  /**
   * Upload one row and report the outcome where the officer is looking.
   *
   * The reload after the attempt is what makes the result visible: the state is
   * persisted in the media table, and the row is re-read from there rather than
   * patched in local state, so a status shown here is the same one the sync
   * worker will act on.
   */
  const handleUpload = useCallback(
    async (record: MediaRecord) => {
      if (!session) return;
      setUploadingId(record.id);
      setNotice(null);
      const result = await uploadAssetNow(session, record);
      const records = await listAssetsFor(clientReportUuid, owner).catch(() => null);
      if (records) setItems(records);
      setUploadingId(null);
      setNotice(result.message);
    },
    [session, clientReportUuid, owner],
  );

  const handleRemove = useCallback(
    (record: MediaRecord) => {
      Alert.alert('حذف فایل', 'این فایل از پیش‌نویس حذف می‌شود.', [
        { style: 'cancel', text: 'انصراف' },
        {
          style: 'destructive',
          text: 'حذف',
          onPress: () => {
            void (async () => {
              await removeAsset(record);
              const records = await listAssetsFor(clientReportUuid, owner).catch(() => null);
              if (!records) return;
              setItems(records);
              onChange(records.length > 0 ? records.map((entry) => entry.id) : undefined);
            })();
          },
        },
      ]);
    },
    [clientReportUuid, owner, onChange],
  );

  const hasItems = (items?.length ?? 0) > 0;

  return (
    <View style={[styles.container, hasError && styles.containerError]}>
      <View style={styles.actionsRow}>
        {ACTIONS.map((action) => (
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            key={action.source}
            onPress={() => void handleAttach(action.source)}
            style={({ pressed }) => [styles.actionChip, busy && styles.disabled, pressed && styles.pressed]}
          >
            <Icon color={AppTheme.colors.primaryStrong} family={action.icon.family} name={action.icon.name} size={16} />
            <Text style={styles.actionText}>{action.label}</Text>
          </Pressable>
        ))}
      </View>

      {busy ? <ActivityIndicator color={AppTheme.colors.primary} size="small" /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      {items === null ? null : !hasItems ? (
        <Text style={styles.hint}>فایلی پیوست نشده است. عکس، فیلم یا سند (PDF) را می‌توانید اضافه کنید.</Text>
      ) : (
        <View style={styles.itemList}>
          {items.map((record) => {
            const kind = kindOf(record);
            const size = formatSize(record.size_bytes);
            const state = uploadStateOf(record);
            const uploading = uploadingId === record.id;
            return (
              <View key={record.id} style={styles.item}>
                {kind === 'image' ? (
                  <Pressable
                    accessibilityLabel="پیش‌نمایش تصویر"
                    accessibilityRole="button"
                    onPress={() => setPreviewUri(record.local_uri)}
                  >
                    <Image source={{ uri: record.local_uri }} style={styles.thumb} />
                  </Pressable>
                ) : (
                  <View style={styles.fileTile}>
                    <Icon
                      color={AppTheme.colors.primaryStrong}
                      family={KIND_ICON[kind].family}
                      name={KIND_ICON[kind].name}
                      size={22}
                    />
                  </View>
                )}

                <View style={styles.itemMeta}>
                  <Text numberOfLines={1} style={styles.itemName}>
                    {fileLabel(record)}
                  </Text>
                  <Text style={styles.itemSub}>
                    {KIND_LABEL[kind]}
                    {size ? ` • ${size}` : ''}
                  </Text>
                  <View style={styles.statusRow}>
                    {uploading ? (
                      <ActivityIndicator color={AppTheme.colors.primary} size="small" />
                    ) : null}
                    <Text
                      style={[
                        styles.statusText,
                        state === 'uploaded' && styles.statusOk,
                        state === 'failed' && styles.statusBad,
                      ]}
                    >
                      {uploading ? ASSET_UPLOAD_LABEL.uploading : ASSET_UPLOAD_LABEL[state]}
                    </Text>
                  </View>
                  {state === 'failed' ? <Text style={styles.itemError}>{uploadErrorOf(record)}</Text> : null}
                </View>

                <View style={styles.itemActions}>
                  {/* Once the server holds the bytes there is nothing to press;
                      the button is the retry, not a decoration. */}
                  {state !== 'uploaded' ? (
                    <IconButton
                      accessibilityLabel="ارسال فایل"
                      disabled={!session || uploading}
                      icon="cloud-upload-outline"
                      onPress={() => void handleUpload(record)}
                      size={38}
                      tone="primary"
                    />
                  ) : null}
                  <IconButton
                    accessibilityLabel="حذف فایل"
                    disabled={busy || uploading}
                    icon="trash"
                    onPress={() => handleRemove(record)}
                    size={38}
                    tone="danger"
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}

      <Modal onRequestClose={() => setPreviewUri(null)} transparent visible={previewUri != null}>
        <Pressable onPress={() => setPreviewUri(null)} style={styles.previewBackdrop}>
          {previewUri ? (
            <Image resizeMode="contain" source={{ uri: previewUri }} style={styles.previewImage} />
          ) : null}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppTheme.colors.surfaceMuted,
    borderRadius: Radius.md,
    gap: 8,
    padding: 10,
  },
  containerError: {
    borderColor: AppTheme.status.danger.border,
    borderWidth: 1,
  },
  actionsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  actionChip: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.primarySoft,
    borderColor: AppTheme.colors.primaryBorder,
    borderRadius: Radius.pill,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: 5,
    minHeight: 44,
    paddingHorizontal: 14,
  },
  actionText: {
    color: AppTheme.colors.primaryStrong,
    fontFamily: Estedad.semiBold,
    fontSize: 12,
    lineHeight: 18,
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  error: {
    color: AppTheme.status.danger.text,
    fontFamily: Estedad.regular,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'right',
  },
  hint: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'right',
  },
  notice: {
    color: AppTheme.colors.primaryStrong,
    fontFamily: Estedad.regular,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'right',
  },
  itemList: { gap: 8 },
  item: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.surface,
    borderColor: AppTheme.colors.border,
    borderRadius: Radius.sm,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: 10,
    padding: 8,
  },
  thumb: {
    backgroundColor: AppTheme.colors.surfaceSunken,
    borderRadius: Radius.sm,
    height: 48,
    width: 48,
  },
  fileTile: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.primarySoft,
    borderRadius: Radius.sm,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  itemMeta: { flex: 1, gap: 2 },
  itemName: {
    color: AppTheme.colors.textStrong,
    fontFamily: Estedad.medium,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'right',
  },
  itemSub: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'right',
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 5,
    marginTop: 1,
  },
  statusText: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'right',
  },
  statusOk: { color: AppTheme.status.success.text },
  statusBad: { color: AppTheme.status.danger.text },
  itemError: {
    color: AppTheme.status.danger.text,
    fontFamily: Estedad.regular,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'right',
  },
  itemActions: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 6,
  },
  previewBackdrop: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.overlayScrim,
    flex: 1,
    justifyContent: 'center',
  },
  previewImage: { height: '80%', width: '95%' },
});
