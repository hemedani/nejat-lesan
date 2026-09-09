import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createSessionService } from '@/auth/session-service';
import { useRequiredSession } from '@/auth/use-required-session';
import { HelpSectionCard } from '@/components/help/help-section';
import { Card } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { ListRow } from '@/components/ui/list-row';
import { getAppConfig } from '@/config/env';
import { AppTheme, Estedad, Radius } from '@/constants/theme';
import { HELP_GROUPS, HELP_META } from '@/content/help-content';
import { useServerUrl } from '@/hooks/use-server-url';

const sessionService = createSessionService();

export default function HelpScreen() {
  const router = useRouter();
  const session = useRequiredSession();
  const { loading: serverUrlLoading, effectiveUrl, refresh: refreshServerUrl } = useServerUrl();

  useFocusEffect(
    useCallback(() => {
      void refreshServerUrl();
    }, [refreshServerUrl]),
  );

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

  const initials = `${session.user.first_name.charAt(0)}${session.user.last_name.charAt(0)}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card variant="default" style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <View style={styles.profileCopy}>
            <Text numberOfLines={1} style={styles.profileName}>
              {session.user.first_name} {session.user.last_name}
            </Text>
            <Text style={styles.profileMeta}>
              کد پرسنلی {session.user.personnel_code ?? 'ثبت نشده'}
            </Text>
          </View>
          <IconButton
            accessibilityLabel="خروج از حساب"
            icon="log-out-outline"
            onPress={confirmLogout}
            tone="danger"
          />
        </Card>

        <View style={styles.introBlock}>
          <Text style={styles.title}>{HELP_META.screenTitle}</Text>
          <Text style={styles.subtitle}>{HELP_META.subtitle}</Text>
        </View>

        {HELP_GROUPS.map(group => (
          <View key={group.id} style={styles.group}>
            <Text style={styles.sectionLabel}>{group.title}</Text>
            <View style={styles.sectionList}>
              {group.sections.map(section => (
                <HelpSectionCard key={section.id} section={section} />
              ))}
            </View>
          </View>
        ))}

        <View style={styles.group}>
          <Text style={styles.sectionLabel}>درباره و پشتیبانی</Text>
          <Card variant="default">
            <Text style={styles.footerNote}>{HELP_META.footerNote}</Text>
            <View style={styles.versionRow}>
              <ListRow
                icon="information-circle-outline"
                iconTone="neutral"
                title={`نسخه برنامه ${appVersion || '۱.۰.۰'}`}
              />
            </View>
            <View style={styles.versionRow}>
              <ListRow
                icon="server-outline"
                iconTone="neutral"
                onPress={() => router.push('/server-settings')}
                showChevron
                subtitle={serverUrlLoading ? 'در حال خواندن…' : effectiveUrl || 'تعریف نشده'}
                title="آدرس سرور"
              />
            </View>
          </Card>
        </View>

        <ListRow
          danger
          icon="log-out-outline"
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
  content: { gap: 18, padding: 20, paddingBottom: 40 },
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
  introBlock: {
    gap: 6,
  },
  title: {
    color: AppTheme.colors.textStrong,
    fontFamily: Estedad.extraBold,
    fontSize: 24,
    lineHeight: 34,
    textAlign: 'right',
  },
  subtitle: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'right',
  },
  group: {
    gap: 10,
  },
  sectionList: {
    gap: 10,
  },
  sectionLabel: {
    color: AppTheme.colors.primaryStrong,
    fontFamily: Estedad.bold,
    fontSize: 13.5,
    lineHeight: 20,
    marginTop: 2,
    textAlign: 'right',
  },
  footerNote: {
    color: AppTheme.colors.textBody,
    fontFamily: Estedad.regular,
    fontSize: 13,
    lineHeight: 22,
    paddingBottom: 4,
    textAlign: 'right',
  },
  versionRow: {
    borderTopColor: AppTheme.colors.hairline,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  logoutRow: {
    backgroundColor: AppTheme.status.danger.bg,
    borderColor: AppTheme.status.danger.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});
