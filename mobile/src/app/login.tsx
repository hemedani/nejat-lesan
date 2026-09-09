import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

import { translateApiError } from '@/api/errors';
import { createSessionService } from '@/auth/session-service';
import { Button } from '@/components/ui/button';
import { Banner } from '@/components/ui/banner';
import { Icon } from '@/components/ui/icon';
import { StatusPill } from '@/components/ui/status-pill';
import { TextField } from '@/components/ui/text-field';
import { useToast } from '@/components/ui/toast';
import { AppIcons } from '@/constants/icon-map';
import { AppTheme, Estedad, Radius } from '@/constants/theme';
import { getConnectivitySnapshot, subscribeToConnectivity } from '@/services/connectivity';
import { useServerUrl } from '@/hooks/use-server-url';

const sessionService = createSessionService();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export default function LoginScreen() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const { loading: serverUrlLoading, effectiveUrl, refresh: refreshServerUrl } = useServerUrl();

  useFocusEffect(
    useCallback(() => {
      void refreshServerUrl();
    }, [refreshServerUrl]),
  );

  useEffect(() => {
    let mounted = true;

    void sessionService.restore().then(session => {
      if (mounted && session) {
        router.replace('/');
      }
    });

    void getConnectivitySnapshot().then(snapshot => {
      if (mounted) {
        setOnline(snapshot.status !== 'offline');
      }
    });
    const unsubscribe = subscribeToConnectivity(snapshot => {
      if (mounted) {
        setOnline(snapshot.status !== 'offline');
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [router]);

  const canSubmit = EMAIL_PATTERN.test(email) && password.length >= MIN_PASSWORD_LENGTH && !isSubmitting;

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await sessionService.login(email.trim().toLowerCase(), password);
      setPassword('');
      router.replace('/');
    } catch (error) {
      setErrorMessage(translateApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandBlock}>
            <Image
              accessibilityLabel="نشان سامانه لسن"
              source={require('@/assets/images/icon.png')}
              style={styles.logo}
            />
            <Text style={styles.eyebrow}>سامانه مدیریت و ثبت رخدادهای ترافیکی</Text>
            <Text style={styles.title}>ورود مأمور گشت</Text>
            <StatusPill
              dot
              icon={online ? AppIcons.status.online.name : AppIcons.status.offline.name}
              label={online ? 'آنلاین' : 'آفلاین'}
              style={styles.connectivityPill}
              tone={online ? 'success' : 'neutral'}
            />
          </View>

          {!online ? (
            <Banner
              icon={AppIcons.status.offline.name}
              message="برای اولین ورود، اتصال اینترنت لازم است. ورودهای بعدی بدون اینترنت هم پشتیبانی می‌شود."
              tone="neutral"
            />
          ) : null}

          <View style={styles.form}>
            <TextField
              accessibilityLabel="ایمیل"
              autoCapitalize="none"
              autoCorrect={false}
              icon="mail"
              keyboardType="email-address"
              label="ایمیل"
              ltr
              onChangeText={value => setEmail(value)}
              placeholder="example@lesan.ir"
              value={email}
            />
            <TextField
              accessibilityLabel="رمز عبور"
              autoCapitalize="none"
              icon="lock-closed-outline"
              label="رمز عبور"
              onChangeText={setPassword}
              placeholder="رمز عبور خود را وارد کنید"
              secure
              value={password}
            />

            {errorMessage ? (
              <Banner icon={AppIcons.status.error.name} message={errorMessage} tone="danger" title="ورود انجام نشد" />
            ) : null}

            <Button
              accessibilityLabel="ورود به سامانه"
              disabled={!canSubmit}
              fullWidth
              label="ورود به سامانه"
              loading={isSubmitting}
              onPress={() => void handleSubmit()}
              size="lg"
              style={styles.submit}
            />

            <Pressable
              accessibilityLabel="راهنمای بازیابی رمز عبور"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() =>
                toast.show('بازیابی رمز عبور از طریق مدیر سامانه انجام می‌شود.', 'info')
              }
              style={({ pressed }) => [styles.helpLink, pressed && styles.pressed]}
            >
              <Icon color={AppTheme.colors.primaryStrong} name="help-circle-outline" size={15} />
              <Text style={styles.helpText}>رمز عبور را فراموش کرده‌اید؟</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Pressable
              accessibilityLabel="تماس با پشتیبانی"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => toast.show('پشتیبانی سامانه: به‌زودی از این بخش تماس بگیرید.', 'info')}
              style={({ pressed }) => [styles.supportLink, pressed && styles.pressed]}
            >
              <Icon color={AppTheme.colors.textSecondary} name="headset-outline" size={16} />
              <Text style={styles.footerAction}>مشکل در ورود؟ تماس با پشتیبانی</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="تنظیم آدرس سرور"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => router.push('/server-settings')}
              style={({ pressed }) => [styles.supportLink, pressed && styles.pressed]}
            >
              <Icon color={AppTheme.colors.textSecondary} name="settings-outline" size={16} />
              <Text style={styles.footerAction}>تنظیم آدرس سرور</Text>
            </Pressable>
            {!serverUrlLoading && effectiveUrl ? (
              <Text selectable style={styles.serverAddress}>
                {effectiveUrl}
              </Text>
            ) : null}
            <Text style={styles.version}>نسخه {version}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: AppTheme.colors.background, flex: 1 },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    gap: 18,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  brandBlock: {
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
  },
  logo: {
    borderRadius: Radius.xl,
    height: 88,
    marginBottom: 10,
    width: 88,
  },
  eyebrow: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 13.5,
    lineHeight: 21,
    textAlign: 'center',
  },
  title: {
    color: AppTheme.colors.textStrong,
    fontFamily: Estedad.extraBold,
    fontSize: 27,
    lineHeight: 40,
    textAlign: 'center',
  },
  connectivityPill: { marginTop: 8 },
  form: { gap: 14 },
  submit: { marginTop: 6 },
  helpLink: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row-reverse',
    gap: 6,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
  },
  helpText: {
    color: AppTheme.colors.primaryStrong,
    fontFamily: Estedad.semiBold,
    fontSize: 14,
    lineHeight: 21,
  },
  pressed: { opacity: 0.7 },
  footer: {
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
  },
  supportLink: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 7,
    minHeight: 44,
    paddingHorizontal: 10,
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  footerAction: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  serverAddress: {
    color: AppTheme.colors.textFaint,
    fontFamily: Estedad.regular,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
  },
  version: {
    color: AppTheme.colors.textFaint,
    fontFamily: Estedad.regular,
    fontSize: 11.5,
    lineHeight: 17,
  },
});
