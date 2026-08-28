import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  fetchAnnouncements,
  markAnnouncementRead,
  type BackendAnnouncement,
} from '@/api/announcements';
import { ApiError } from '@/api/errors';
import { Badge } from '@/components/ui/badge';
import { Banner } from '@/components/ui/banner';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { SkeletonList } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { setUnreadCount } from '@/components/unread-count-store';
import type { IconFamily, IconName } from '@/constants/icon-map';
import { AppIcons } from '@/constants/icon-map';
import { AppTheme, Estedad, Radius, type StatusTone } from '@/constants/theme';
import { useRequiredSession } from '@/auth/use-required-session';

const PRIORITY_ORDER = ['فوری', 'مهم', 'عادی'];

type PriorityStyle = { tone: StatusTone; icon: IconName; family?: IconFamily };

const PRIORITY_STYLES: Record<string, PriorityStyle> = {
  فوری: { tone: 'danger', icon: 'alert-decagram', family: 'md' },
  مهم: { tone: 'warning', icon: 'flag' },
  عادی: { tone: 'neutral', icon: 'information-circle-outline' },
};

function priorityLabel(priority: string | undefined): string {
  return priority && priority.length > 0 ? priority : 'عادی';
}

function priorityStyleOf(priority: string | undefined): PriorityStyle {
  return PRIORITY_STYLES[priorityLabel(priority)] ?? PRIORITY_STYLES['عادی'];
}

function formatDate(value: string | undefined): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function isExpired(item: BackendAnnouncement): boolean {
  if (!item.expires_at) {
    return false;
  }
  const expiry = new Date(item.expires_at).getTime();
  return Number.isFinite(expiry) && expiry < Date.now();
}

export default function AnnouncementsScreen() {
  const session = useRequiredSession();
  const [items, setItems] = useState<BackendAnnouncement[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(async () => {
    if (!session) {
      return;
    }
    try {
      const list = await fetchAnnouncements(session, { page: 1, limit: 50 });
      setItems(list.filter(item => !isExpired(item)));
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof ApiError && loadError.code === 'offline'
          ? 'بدون اینترنت؛ پس از اتصال، اعلان‌ها نمایش داده می‌شوند.'
          : 'بارگیری اعلان‌ها انجام نشد.',
      );
    }
  }, [session]);

  useEffect(() => {
    let cancelled = false;
    if (!session) {
      return;
    }
    fetchAnnouncements(session, { page: 1, limit: 50 })
      .then(list => {
        if (!cancelled) {
          setItems(list.filter(item => !isExpired(item)));
          setError(null);
        }
      })
      .catch(loadError => {
        if (!cancelled) {
          setError(
            loadError instanceof ApiError && loadError.code === 'offline'
              ? 'بدون اینترنت؛ پس از اتصال، اعلان‌ها نمایش داده می‌شوند.'
              : 'بارگیری اعلان‌ها انجام نشد.',
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [session, reloadToken]);

  async function handleRefresh() {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }

  function handlePress(item: BackendAnnouncement) {
    setExpandedId(current => (current === item._id ? null : item._id));
    if (item.is_read || !session) {
      return;
    }
    // Optimistic read state; the backend keeps the authoritative record.
    setItems(current =>
      current
        ? current.map(entry =>
            entry._id === item._id ? { ...entry, is_read: true, read_at: new Date().toISOString() } : entry,
          )
        : current,
    );
    markAnnouncementRead(session, item._id).catch(readError => {
      if (readError instanceof ApiError && readError.code === 'offline') {
        return;
      }
      setItems(current =>
        current
          ? current.map(entry =>
              entry._id === item._id ? { ...entry, is_read: false, read_at: null } : entry,
            )
          : current,
      );
    });
  }

  const unreadCount = items?.filter(item => !item.is_read).length ?? 0;

  useEffect(() => {
    setUnreadCount(unreadCount);
  }, [unreadCount]);
  const sorted =
    items == null
      ? null
      : [...items].sort((a, b) => {
          const priorityDelta =
            PRIORITY_ORDER.indexOf(priorityLabel(a.priority)) -
            PRIORITY_ORDER.indexOf(priorityLabel(b.priority));
          if (priorityDelta !== 0) {
            return priorityDelta;
          }
          const aTime = new Date(a.createdAt ?? 0).getTime();
          const bTime = new Date(b.createdAt ?? 0).getTime();
          return bTime - aTime;
        });

  const offlineError = error != null && error.startsWith('بدون اینترنت');

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
        <View style={styles.headerRow}>
          <Text style={styles.title}>اعلان‌ها</Text>
          {sorted != null && unreadCount > 0 ? (
            <View style={styles.unreadWrap}>
              <Badge count={unreadCount} />
              <Text style={styles.unreadText}>اعلان جدید</Text>
            </View>
          ) : null}
        </View>

        {sorted === null && error === null ? (
          <SkeletonList rows={4} rowHeight={110} />
        ) : error != null && sorted === null ? (
          <Banner
            actionLabel={offlineError ? undefined : 'تلاش دوباره'}
            icon={offlineError ? AppIcons.status.offline.name : AppIcons.status.error.name}
            message={error}
            onAction={() => setReloadToken(token => token + 1)}
            tone={offlineError ? 'neutral' : 'danger'}
          />
        ) : sorted != null && sorted.length === 0 ? (
          <EmptyState
            description="پیام‌های مرکز کنترل و اطلاعیه‌های عملیاتی در این بخش نمایش داده می‌شود."
            icon={AppIcons.home.announcements.name}
            title="اعلانی وجود ندارد"
          />
        ) : (
          sorted?.map(item => {
            const expanded = expandedId === item._id;
            const priority = priorityStyleOf(item.priority);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                key={item._id}
                onPress={() => handlePress(item)}
                style={({ pressed }) => [
                  styles.cardWrap,
                  !item.is_read && styles.cardUnreadBorder,
                  pressed && styles.pressed,
                ]}
              >
                <Card variant="flat">
                  <View style={styles.chipRow}>
                    <StatusPill icon={priority.icon} iconFamily={priority.family} label={priorityLabel(item.priority)} tone={priority.tone} />
                    <View style={styles.chipRowLeading}>
                      {!item.is_read ? <View style={styles.unreadDot} /> : null}
                      {formatDate(item.createdAt) ? <Text style={styles.date}>{formatDate(item.createdAt)}</Text> : null}
                      <Icon color={AppTheme.colors.textFaint} name={expanded ? 'chevron-up' : 'chevron-down'} size={15} />
                    </View>
                  </View>
                  <Text numberOfLines={expanded ? undefined : 2} style={[styles.cardTitle, !item.is_read && styles.cardTitleUnread]}>
                    {item.title}
                  </Text>
                  <Text numberOfLines={expanded ? undefined : 3} style={styles.cardBody}>
                    {item.body}
                  </Text>
                  {item.expires_at && !expanded ? (
                    <Text style={styles.expiry}>اعتبار تا {formatDate(item.expires_at)}</Text>
                  ) : null}
                </Card>
              </Pressable>
            );
          })
        )}

        <Text style={styles.hint}>برای به‌روزرسانی فهرست، صفحه را به پایین بکشید.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: AppTheme.colors.background, flex: 1 },
  content: { gap: 14, padding: 20, paddingBottom: 40 },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 10,
    justifyContent: 'space-between',
  },
  title: {
    color: AppTheme.colors.textStrong,
    fontFamily: Estedad.extraBold,
    fontSize: 24,
    lineHeight: 34,
    textAlign: 'right',
  },
  unreadWrap: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 7,
  },
  unreadText: {
    color: AppTheme.colors.primaryStrong,
    fontFamily: Estedad.semiBold,
    fontSize: 12.5,
    lineHeight: 19,
  },
  cardWrap: {
    borderRadius: Radius.lg,
  },
  cardUnreadBorder: {
    borderRightColor: AppTheme.colors.primary,
    borderRightWidth: 4,
  },
  pressed: { opacity: 0.85 },
  chipRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 8,
    justifyContent: 'space-between',
  },
  chipRowLeading: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 8,
  },
  unreadDot: {
    backgroundColor: AppTheme.colors.primary,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  date: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 11.5,
    lineHeight: 17,
  },
  cardTitle: {
    color: AppTheme.colors.textStrong,
    fontFamily: Estedad.semiBold,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'right',
  },
  cardTitleUnread: {
    fontFamily: Estedad.bold,
  },
  cardBody: {
    color: AppTheme.colors.textBody,
    fontFamily: Estedad.regular,
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'right',
  },
  expiry: {
    color: AppTheme.colors.textFaint,
    fontFamily: Estedad.regular,
    fontSize: 11,
    lineHeight: 17,
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
