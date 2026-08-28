import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchMe, type MeProfile } from '@/api/user';
import { createSessionService } from '@/auth/session-service';
import type { ActiveShift, Session } from '@/domain/types';
import { getAppConfig } from '@/config/env';
import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { useToast } from '@/components/ui/toast';
import type { IconFamily, IconName } from '@/constants/icon-map';
import { AppTheme, Estedad, Radius } from '@/constants/theme';
import { useRequiredSession } from '@/auth/use-required-session';

const sessionService = createSessionService();

type RowSpec = {
  key: string;
  label: string;
  detail?: string;
  icon: IconName;
  family?: IconFamily;
  soon?: boolean;
  onPress?: () => void;
};

export default function MoreScreen() {
  const router = useRouter();
  const toast = useToast();
  const session = useRequiredSession() as Session | null;
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const [shift, setShift] = useState<ActiveShift | null>(null);
  const [shiftState, setShiftState] = useState<'loading' | 'active' | 'none' | 'error'>('loading');

  useEffect(() => {
    if (!session) {
      router.replace('/login');
    }
  }, [session, router]);

  const [reloadToken, setReloadToken] = useState(0);

  // `user.getMe` is the single refresh source for profile + shift + devices.
  useEffect(() => {
    if (!session) {
      return;
    }
    let cancelled = false;
    fetchMe(session)
      .then(me => {
        if (cancelled) {
          return;
        }
        setProfile(me);
        if (me.activeShift) {
          setShift(me.activeShift);
          setShiftState('active');
        } else {
          setShift(null);
          setShiftState('none');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setShiftState(state => (state === 'active' ? state : 'error'));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [session, reloadToken]);

  function confirmLogout() {
    Alert.alert('خروج از حساب', 'آیا برای خروج از حساب کاربری مطمئن هستید؟ پیش‌نویس‌های شما روی دستگاه باقی می‌مانند.', [
      { style: 'cancel', text: 'انصراف' },
      {
        onPress: () => {
          void sessionService.logout().then(() => router.replace('/login'));
        },
        style: 'destructive',
        text: 'خروج',
      },
    ]);
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View />
      </SafeAreaView>
    );
  }

  let appVersion = '';
  try {
    appVersion = getAppConfig().appVersion;
  } catch {
    appVersion = '—';
  }

  const systemRows: RowSpec[] = [
    { detail: `${profile?.activeDevicesCount ?? 1}`, icon: 'cellphone', family: 'md', key: 'devices', label: 'دستگاه‌های فعال' },
    { icon: 'lock-closed-outline', key: 'pin', label: 'ورود سریع (PIN/اثر انگشت)', soon: true },
    { icon: 'time-outline', key: 'lock', label: 'قفل خودکار برنامه', soon: true },
    { icon: 'notifications-outline', key: 'notifications', label: 'اعلان‌ها', soon: true },
    {
      icon: 'map',
      key: 'mapcache',
      label: 'نقشه آفلاین',
      onPress: () => router.push('/map-offline'),
    },
    { icon: 'book-open-variant', family: 'md', key: 'guide', label: 'راهنمای سامانه', soon: true },
    { icon: 'headset-outline', key: 'support', label: 'پشتیبانی', soon: true },
  ];

  function handleRowPress(row: RowSpec) {
    if (row.onPress) {
      row.onPress();
      return;
    }
    if (row.soon) {
      toast.show('این قابلیت به‌زودی فعال می‌شود.', 'info');
    }
  }

  const initials = `${session.user.first_name.charAt(0)}${session.user.last_name.charAt(0)}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>بیشتر</Text>

        <Card variant="default" style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <View style={styles.profileCopy}>
            <Text numberOfLines={1} style={styles.profileName}>
              {session.user.first_name} {session.user.last_name}
            </Text>
            <Text style={styles.profileMeta}>
              کد پرسنلی {profile?.personnel_code ?? session.user.personnel_code ?? 'ثبت نشده'}
            </Text>
          </View>
        </Card>

        <Text style={styles.sectionLabel}>شیفت و خودرو</Text>
        <Card variant="default">
          {shiftState === 'loading' ? (
            <Text style={styles.muted}>در حال دریافت اطلاعات شیفت…</Text>
          ) : shiftState === 'active' && shift ? (
            <>
              <ListRow icon="time-outline" subtitle={`${shift.starts_at.slice(11, 16)} تا ${shift.ends_at.slice(11, 16)}`} title={shift.shift_type} />
              {shift.patrol_unit ? (
                <ListRow icon="shield-checkmark-outline" title={shift.patrol_unit.title} />
              ) : null}
              {shift.vehicle ? <ListRow icon="car" title={shift.vehicle.title} /> : null}
            </>
          ) : shiftState === 'none' ? (
            <Text style={styles.muted}>در حال حاضر شیفت فعالی ندارید.</Text>
          ) : (
            <ListRow
              danger
              icon="refresh"
              onPress={() => setReloadToken(token => token + 1)}
              showChevron
              title="بارگیری اطلاعات شیفت انجام نشد — تلاش دوباره"
            />
          )}
        </Card>

        <Text style={styles.sectionLabel}>سامانه و دستگاه</Text>
        <Card variant="default">
          {systemRows.map(row => (
            <ListRow
              disabled={false}
              icon={row.icon}
              iconFamily={row.family}
              iconTone={row.soon ? 'neutral' : 'primary'}
              key={row.key}
              onPress={() => handleRowPress(row)}
              showChevron={!row.soon && Boolean(row.onPress)}
              title={row.label}
            />
          ))}
          <ListRow icon="information-circle-outline" iconTone="neutral" title={`نسخه برنامه ${appVersion || '۱.۰.۰'}`} />
        </Card>

        <ListRow
          danger
          icon="log-out"
          onPress={confirmLogout}
          style={styles.logoutRow}
          title="خروج از حساب"
        />
      </ScrollView>
    </SafeAreaView>
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
  profileCard: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 14,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.primarySoft,
    borderRadius: Radius.pill,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  avatarInitials: {
    color: AppTheme.colors.primaryStrong,
    fontFamily: Estedad.bold,
    fontSize: 20,
  },
  profileCopy: {
    flex: 1,
    gap: 3,
  },
  profileName: {
    color: AppTheme.colors.textStrong,
    fontFamily: Estedad.bold,
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'right',
  },
  profileMeta: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
  },
  sectionLabel: {
    color: AppTheme.colors.primaryStrong,
    fontFamily: Estedad.bold,
    fontSize: 13.5,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'right',
  },
  muted: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 13,
    lineHeight: 21,
    paddingVertical: 10,
    textAlign: 'right',
  },
  logoutRow: {
    backgroundColor: AppTheme.status.danger.bg,
    borderColor: AppTheme.status.danger.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});
