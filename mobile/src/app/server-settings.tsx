import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { useToast } from '@/components/ui/toast';
import { AppTheme, Estedad, type StatusTone } from '@/constants/theme';
import { normalizeServerUrl, probeServerEndpoint } from '@/domain/server-url';
import { useServerUrl } from '@/hooks/use-server-url';
import { clearServerUrlOverride, saveServerUrlOverride } from '@/services/server-url';

type ProbeState = { tone: Extract<StatusTone, 'success' | 'danger'>; message: string } | null;

export default function ServerSettingsScreen() {
  const router = useRouter();
  const toast = useToast();
  const { loading, savedUrl, defaultUrl, effectiveUrl, hasOverride, refresh } = useServerUrl();

  const [input, setInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [probe, setProbe] = useState<ProbeState>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const prefilled = useRef(false);

  useEffect(() => {
    if (!loading && !prefilled.current) {
      prefilled.current = true;
      setInput(savedUrl ?? '');
    }
  }, [loading, savedUrl]);

  function showInputError(message: string) {
    setInputError(message);
    setProbe(null);
  }

  async function handleProbe() {
    if (isTesting) {
      return;
    }
    setInputError(null);
    const trimmed = input.trim();
    let target: string;
    if (!trimmed) {
      if (!effectiveUrl) {
        showInputError('ابتدا آدرس سرور را وارد کنید.');
        return;
      }
      target = effectiveUrl;
    } else {
      const normalized = normalizeServerUrl(trimmed);
      if (!normalized.ok) {
        showInputError(normalized.error);
        return;
      }
      target = normalized.url;
    }
    setProbe(null);
    setIsTesting(true);
    const result = await probeServerEndpoint(target);
    setProbe(result.reachable ? { tone: 'success', message: result.message } : { tone: 'danger', message: result.message });
    setIsTesting(false);
  }

  async function handleSave() {
    if (isSaving) {
      return;
    }
    setInputError(null);
    setProbe(null);
    const trimmed = input.trim();

    setIsSaving(true);
    try {
      if (!trimmed) {
        await clearServerUrlOverride();
        await refresh();
        setInput('');
        toast.show('به آدرس پیش‌فرض برنامه برگشت.', 'success');
        return;
      }
      const normalized = normalizeServerUrl(trimmed);
      if (!normalized.ok) {
        setInputError(normalized.error);
        return;
      }
      await saveServerUrlOverride(normalized.url);
      await refresh();
      setInput(normalized.url);
      toast.show('آدرس سرور ذخیره شد.', 'success');
      router.back();
    } catch {
      setInputError('ذخیره آدرس سرور ممکن نشد؛ دوباره تلاش کنید.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReset() {
    if (!hasOverride || isSaving) {
      return;
    }
    setInputError(null);
    setProbe(null);
    setIsSaving(true);
    try {
      await clearServerUrlOverride();
      await refresh();
      setInput('');
      toast.show('به آدرس پیش‌فرض برنامه برگشت.', 'success');
    } catch {
      setInputError('بازنشانی آدرس سرور ممکن نشد؛ دوباره تلاش کنید.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader onBack={() => router.back()} title="تنظیمات سرور" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Banner
          icon="server-outline"
          message="اگر آدرس را وارد نکنید، برنامه به آدرس پیش‌فرض بسته‌بندی‌شده متصل می‌شود. آدرس واردشده روی همین دستگاه ذخیره و برای همه درخواست‌ها استفاده می‌شود."
          tone="info"
        />

        <Card variant="default">
          <Text style={styles.fieldLabel}>آدرس سرور</Text>
          <TextField
            accessibilityLabel="آدرس سرور"
            autoCapitalize="none"
            autoCorrect={false}
            error={inputError}
            icon="server-outline"
            ltr
            onChangeText={value => {
              setInput(value);
              if (inputError) {
                setInputError(null);
              }
            }}
            placeholder="http://46.245.98.207:1400"
            value={input}
          />
          <Text style={styles.fieldHint}>
            نمونه: http://10.0.2.2:1404 (شبیه‌ساز اندروید) یا http://ip:1400 (گوشی فیزیکی)
          </Text>
        </Card>

        <Card variant="flat">
          <View style={styles.statusRow}>
            <Icon color={AppTheme.colors.primaryStrong} name="wifi" size={18} />
            <Text style={styles.statusLabel}>آدرس در حال استفاده</Text>
            <Text selectable style={styles.statusValue}>
              {loading ? 'در حال خواندن…' : effectiveUrl || '—'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statusRow}>
            <Icon color={AppTheme.colors.textFaint} name="layers-outline" size={18} />
            <Text style={styles.statusLabel}>آدرس پیش‌فرض برنامه</Text>
            <Text selectable style={styles.statusValue}>
              {loading ? '…' : defaultUrl || 'تعریف نشده'}
            </Text>
          </View>
        </Card>

        {probe ? (
          <Banner
            icon={probe.tone === 'success' ? 'checkmark-circle' : 'alert-circle'}
            message={probe.message}
            tone={probe.tone}
          />
        ) : null}

        <View style={styles.actions}>
          <Button
            accessibilityLabel="بررسی اتصال به سرور"
            fullWidth
            icon="wifi"
            loading={isTesting}
            onPress={() => void handleProbe()}
            variant="outline"
            label="بررسی اتصال"
          />
          <Button
            accessibilityLabel="ذخیره آدرس سرور"
            fullWidth
            loading={isSaving}
            onPress={() => void handleSave()}
            label="ذخیره آدرس سرور"
            size="lg"
          />
          {hasOverride ? (
            <Button
              accessibilityLabel="بازنشانی به آدرس پیش‌فرض"
              disabled={loading}
              fullWidth
              icon="refresh"
              onPress={() => void handleReset()}
              variant="ghost"
              label="بازنشانی به آدرس پیش‌فرض"
            />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: AppTheme.colors.background, flex: 1 },
  content: { gap: 16, padding: 20, paddingBottom: 40 },
  fieldLabel: {
    color: AppTheme.colors.textBody,
    fontFamily: Estedad.semiBold,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 8,
    textAlign: 'right',
  },
  fieldHint: {
    color: AppTheme.colors.textFaint,
    fontFamily: Estedad.regular,
    fontSize: 11.5,
    lineHeight: 19,
    marginTop: 8,
    textAlign: 'right',
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 10,
    paddingVertical: 4,
  },
  statusLabel: {
    color: AppTheme.colors.textSecondary,
    flex: 1,
    fontFamily: Estedad.semiBold,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
  },
  statusValue: {
    color: AppTheme.colors.textStrong,
    flexShrink: 1,
    fontFamily: Estedad.regular,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'left',
  },
  divider: {
    backgroundColor: AppTheme.colors.hairline,
    height: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },
  actions: { gap: 10, marginTop: 4 },
});
