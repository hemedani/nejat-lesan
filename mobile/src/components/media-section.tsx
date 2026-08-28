import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  attachImage,
  listMediaFor,
  removeMedia,
  type AttachResult,
  type MediaCategory,
} from '@/services/media-service';
import type { MediaRecord } from '@/storage/local-database';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { AppIcons, type IconFamily, type IconName } from '@/constants/icon-map';
import { AppTheme, Estedad, Radius } from '@/constants/theme';

type MediaSectionProps = {
  clientReportUuid: string;
  category: MediaCategory;
  owner: string;
  title: string;
};

const CATEGORY_ICONS: Record<MediaCategory, { name: IconName; family?: IconFamily }> = {
  plate: AppIcons.media.plate,
  insurance: AppIcons.media.insurance,
  croquis: AppIcons.media.croquis,
  damage: AppIcons.media.damage,
};

const FAILURE_MESSAGES: Record<Exclude<AttachResult, { ok: true }>['reason'], string> = {
  permission_denied: 'دسترسی دوربین/گالری رد شد؛ از تنظیمات دستگاه مجوز دهید.',
  cancelled: '',
  failed: 'ذخیره تصویر انجام نشد؛ دوباره تلاش کنید.',
};

export function MediaSection({ clientReportUuid, category, owner, title }: MediaSectionProps) {
  const [items, setItems] = useState<MediaRecord[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const reload = useCallback(() => {
    listMediaFor(clientReportUuid, category, owner)
      .then(records => setItems(records))
      .catch(() => setItems([]));
  }, [clientReportUuid, category, owner]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function handleAttach(source: 'camera' | 'library', replaceId?: string) {
    setBusy(true);
    setError(null);
    const result = await attachImage({
      category,
      clientReportUuid,
      owner,
      replaceId,
      source,
    });
    setBusy(false);
    if (result.ok) {
      reload();
      return;
    }
    const message = FAILURE_MESSAGES[result.reason];
    if (message) {
      setError(message);
    }
  }

  function confirmRemove(item: MediaRecord) {
    Alert.alert('حذف تصویر', 'این تصویر از پیش‌نویس حذف می‌شود.', [
      { style: 'cancel', text: 'انصراف' },
      {
        onPress: () => {
          void removeMedia(item).then(reload);
        },
        style: 'destructive',
        text: 'حذف',
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Icon
            color={AppTheme.colors.primaryStrong}
            family={CATEGORY_ICONS[category].family}
            name={CATEGORY_ICONS[category].name}
            size={16}
          />
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.actionsRow}>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => void handleAttach('camera')}
            style={({ pressed }) => [styles.actionChip, busy && styles.disabled, pressed && styles.pressed]}
          >
            <Icon color={AppTheme.colors.onPrimary} name="camera" size={15} />
            <Text style={styles.actionText}>دوربین</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => void handleAttach('library')}
            style={({ pressed }) => [
              styles.actionChip,
              styles.galleryChip,
              busy && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Icon color={AppTheme.colors.primaryStrong} name="images" size={15} />
            <Text style={styles.galleryText}>گالری</Text>
          </Pressable>
        </View>
      </View>

      {busy ? <ActivityIndicator color={AppTheme.colors.primary} size="small" /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {items === null ? null : items.length === 0 ? (
        <Text style={styles.hint}>تصویری ثبت نشده است.</Text>
      ) : (
        <View style={styles.thumbRow}>
          {items.map(item => (
            <Pressable
              accessibilityLabel={`پیش‌نمایش ${title}`}
              accessibilityRole="button"
              key={item.id}
              onPress={() => setPreviewUri(item.local_uri)}
              style={styles.thumb}
            >
              <Image source={{ uri: item.local_uri }} style={styles.image} />
              <View style={styles.itemActions}>
                <IconButton
                  accessibilityLabel={`تعویض ${title}`}
                  disabled={busy}
                  icon="sync"
                  onPress={() => void handleAttach('camera', item.id)}
                  size={38}
                  tone="primary"
                />
                <IconButton
                  accessibilityLabel={`حذف ${title}`}
                  disabled={busy}
                  icon="trash"
                  onPress={() => confirmRemove(item)}
                  size={38}
                  tone="danger"
                />
              </View>
            </Pressable>
          ))}
        </View>
      )}

      <Modal
        onRequestClose={() => setPreviewUri(null)}
        transparent
        visible={previewUri != null}
      >
        <Pressable onPress={() => setPreviewUri(null)} style={styles.previewBackdrop}>
          {previewUri ? <Image resizeMode="contain" source={{ uri: previewUri }} style={styles.previewImage} /> : null}
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
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 6,
  },
  title: {
    color: AppTheme.colors.textStrong,
    fontFamily: Estedad.semiBold,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
  },
  actionsRow: { flexDirection: 'row-reverse', gap: 6 },
  actionChip: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.primary,
    borderRadius: Radius.pill,
    flexDirection: 'row-reverse',
    gap: 5,
    minHeight: 40,
    paddingHorizontal: 12,
  },
  galleryChip: {
    backgroundColor: AppTheme.colors.primarySoft,
    borderColor: AppTheme.colors.primaryBorder,
    borderWidth: 1,
  },
  actionText: {
    color: AppTheme.colors.onPrimary,
    fontFamily: Estedad.semiBold,
    fontSize: 12,
    lineHeight: 18,
  },
  galleryText: {
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
  thumbRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  thumb: { gap: 4 },
  image: {
    backgroundColor: AppTheme.colors.surfaceSunken,
    borderRadius: Radius.sm,
    height: 96,
    width: 128,
  },
  itemActions: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
  },
  previewBackdrop: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.overlayScrim,
    flex: 1,
    justifyContent: 'center',
  },
  previewImage: { height: '80%', width: '95%' },
});
