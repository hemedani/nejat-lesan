import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { translateApiError } from '@/api/errors';
import { createSessionService } from '@/auth/session-service';
import { ThemedText } from '@/components/themed-text';
import { Estedad, Fonts } from '@/constants/theme';

const sessionService = createSessionService();

export default function LoginScreen() {
  const router = useRouter();
  const [personnelCode, setPersonnelCode] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let mounted = true;
    sessionService.restore().then(session => {
      if (mounted && session) {
        router.replace('/home');
      }
    });
    return () => {
      mounted = false;
    };
  }, [router]);

  const canSubmit = personnelCode.length > 0 && password.length >= 8 && !isSubmitting;

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await sessionService.login(personnelCode, password);
      setIsLoggedIn(true);
      setPassword('');
      router.replace('/home');
    } catch (error) {
      setErrorMessage(translateApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
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
            <ThemedText style={styles.brandName}>لِسَن</ThemedText>
            <ThemedText type="title" style={styles.title}>ورود مأمور گشت</ThemedText>
            <ThemedText style={styles.subtitle}>سامانه ثبت و مدیریت حوادث ترافیکی</ThemedText>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <ThemedText style={styles.label}>کد پرسنلی</ThemedText>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="number-pad"
                maxLength={20}
                onChangeText={value => setPersonnelCode(value.replace(/[^0-9]/g, ''))}
                placeholder="کد پرسنلی خود را وارد کنید"
                placeholderTextColor="#8a96a3"
                style={styles.input}
                textAlign="right"
                textContentType="username"
                value={personnelCode}
              />
            </View>

            <View style={styles.fieldGroup}>
              <ThemedText style={styles.label}>رمز عبور</ThemedText>
              <View style={styles.passwordField}>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setPassword}
                  placeholder="رمز عبور خود را وارد کنید"
                  placeholderTextColor="#8a96a3"
                  secureTextEntry={!isPasswordVisible}
                  style={styles.passwordInput}
                  textAlign="right"
                  textContentType="password"
                  value={password}
                />
                <Pressable
                  accessibilityLabel={isPasswordVisible ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور'}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => setIsPasswordVisible(value => !value)}
                  style={styles.visibilityButton}
                >
                  <ThemedText style={styles.visibilityText}>
                    {isPasswordVisible ? 'پنهان' : 'نمایش'}
                  </ThemedText>
                </Pressable>
              </View>
            </View>

            {errorMessage && <ThemedText style={styles.error}>{errorMessage}</ThemedText>}
            {isLoggedIn && <ThemedText style={styles.success}>ورود با موفقیت انجام شد.</ThemedText>}

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSubmit, busy: isSubmitting }}
              disabled={!canSubmit}
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.submitButton,
                !canSubmit && styles.submitDisabled,
                pressed && canSubmit && styles.submitPressed,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <ThemedText style={styles.submitText}>ورود به سامانه</ThemedText>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => undefined}
              style={styles.helpButton}
            >
              <ThemedText style={styles.helpText}>فراموشی رمز عبور</ThemedText>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>نسخه ۱.۰.۰</ThemedText>
            <ThemedText style={styles.footerText}>پشتیبانی سامانه</ThemedText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#f4f7f9',
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  brandBlock: {
    alignItems: 'center',
    paddingTop: 20,
  },
  logo: {
    borderRadius: 24,
    height: 88,
    marginBottom: 14,
    width: 88,
  },
  brandName: {
    color: '#123248',
    fontFamily: Estedad.extraBold,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 30,
  },
  title: {
    color: '#123248',
    fontFamily: Estedad.extraBold,
    fontSize: 27,
    fontWeight: '800',
    lineHeight: 38,
    marginTop: 22,
    textAlign: 'center',
  },
  subtitle: {
    color: '#607482',
    fontSize: 15,
    lineHeight: 24,
    marginTop: 4,
    textAlign: 'center',
  },
  form: {
    gap: 18,
    marginTop: 36,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    color: '#294858',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#d6e0e5',
    borderRadius: 12,
    borderWidth: 1,
    color: '#183545',
    fontSize: 16,
    fontFamily: Fonts.sans,
    height: 54,
    paddingHorizontal: 16,
  },
  passwordField: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#d6e0e5',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    height: 54,
  },
  passwordInput: {
    color: '#183545',
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 16,
    height: '100%',
    paddingHorizontal: 16,
  },
  visibilityButton: {
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 62,
    paddingHorizontal: 10,
  },
  visibilityText: {
    color: '#087f8c',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  error: {
    backgroundColor: '#fff0f0',
    borderRadius: 10,
    color: '#b33a3a',
    fontSize: 14,
    lineHeight: 22,
    padding: 12,
    textAlign: 'right',
  },
  success: {
    color: '#217a5b',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#087f8c',
    borderRadius: 12,
    height: 54,
    justifyContent: 'center',
    marginTop: 4,
  },
  submitDisabled: {
    backgroundColor: '#a7bbc1',
  },
  submitPressed: {
    opacity: 0.84,
  },
  submitText: {
    color: '#ffffff',
    fontFamily: Estedad.bold,
    fontSize: 16,
    fontWeight: '800',
  },
  helpButton: {
    alignSelf: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
  },
  helpText: {
    color: '#087f8c',
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    gap: 4,
    marginTop: 34,
  },
  footerText: {
    color: '#7a8c96',
    fontSize: 12,
    lineHeight: 18,
  },
});
