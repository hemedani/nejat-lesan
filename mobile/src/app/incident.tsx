import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createAccidentDraft } from '@/domain/draft-service';
import type { AccidentDraft } from '@/domain/types';
import { ThemedText } from '@/components/themed-text';

export default function IncidentDraftScreen() {
  const router = useRouter();
  const [draft, setDraft] = useState<AccidentDraft | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    createAccidentDraft()
      .then(createdDraft => {
        if (mounted) {
          setDraft(createdDraft);
        }
      })
      .catch(() => {
        if (mounted) {
          setErrorMessage('ذخیره پیش‌نویس انجام نشد. دوباره تلاش کنید.');
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle" style={styles.title}>ثبت حادثه جدید</ThemedText>
        <ThemedText style={styles.description}>
          پیش‌نویس شما از همین حالا روی دستگاه ذخیره می‌شود و در حالت آفلاین نیز قابل ادامه است.
        </ThemedText>

        {draft ? (
          <ThemedText style={styles.status}>
            شناسه پیش‌نویس: {draft.client_report_uuid}
            {'\n'}وضعیت: {draft.sync_status}
          </ThemedText>
        ) : errorMessage ? (
          <ThemedText style={styles.error}>{errorMessage}</ThemedText>
        ) : (
          <ActivityIndicator color="#087f8c" />
        )}

        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={styles.backText}>بازگشت به داشبورد</ThemedText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#f4f7f9', flex: 1 },
  content: { gap: 20, padding: 24 },
  title: { color: '#123248', fontSize: 26, textAlign: 'right' },
  description: { color: '#607482', fontSize: 15, lineHeight: 26, textAlign: 'right' },
  status: { backgroundColor: '#ffffff', borderRadius: 14, color: '#294858', fontSize: 14, lineHeight: 26, padding: 18, textAlign: 'right' },
  error: { color: '#b33a3a', fontSize: 14, textAlign: 'right' },
  backButton: { alignItems: 'center', borderColor: '#087f8c', borderRadius: 12, borderWidth: 1, minHeight: 50, justifyContent: 'center' },
  backText: { color: '#087f8c', fontSize: 15, fontWeight: '700' },
});
