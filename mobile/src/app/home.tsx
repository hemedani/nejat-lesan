import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getActiveShift } from '@/api/shift';
import { translateApiError } from '@/api/errors';
import type { ActiveShift, Session } from '@/domain/types';
import { createSessionService } from '@/auth/session-service';
import { getConnectivitySnapshot, subscribeToConnectivity, type ConnectivitySnapshot } from '@/services/connectivity';
import { ThemedText } from '@/components/themed-text';

const sessionService = createSessionService();

export default function HomeScreen() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [shift, setShift] = useState<ActiveShift | null>(null);
  const [connectivity, setConnectivity] = useState<ConnectivitySnapshot | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function refreshShift(restoredSession: Session, currentConnectivity: ConnectivitySnapshot) {
      if (currentConnectivity.status === 'offline') {
        return;
      }
      try {
        const activeShift = await getActiveShift(restoredSession, { set: {}, get: {} });
        if (mounted) {
          setShift(activeShift);
          await sessionService.updateLastSync();
          setLastSyncAt(new Date().toISOString());
          setErrorMessage(null);
        }
      } catch (error) {
        if (mounted) {
          setErrorMessage(translateApiError(error));
        }
      }
    }

    async function restoreHome() {
      const restoredSession = await sessionService.restore();
      if (!restoredSession) {
        router.replace('/');
        return;
      }
      if (mounted) {
        setSession(restoredSession);
      }

      const currentConnectivity = await getConnectivitySnapshot();
      if (mounted) {
        setConnectivity(currentConnectivity);
      }

      await refreshShift(restoredSession, currentConnectivity);
      if (mounted) {
        setIsLoading(false);
      }
    }
    restoreHome();
    const unsubscribe = subscribeToConnectivity(snapshot => {
      if (mounted) {
        setConnectivity(snapshot);
        if (session) {
          refreshShift(session, snapshot);
        }
      }
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [router, session]);

  async function refreshHome() {
    if (!session || isRefreshing) {
      return;
    }
    setIsRefreshing(true);
    const currentConnectivity = await getConnectivitySnapshot();
    setConnectivity(currentConnectivity);
    if (currentConnectivity.status !== 'offline') {
      try {
        const activeShift = await getActiveShift(session, { set: {}, get: {} });
        setShift(activeShift);
        await sessionService.updateLastSync();
        setLastSyncAt(new Date().toISOString());
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(translateApiError(error));
      }
    }
    setIsRefreshing(false);
  }

  async function logout() {
    await sessionService.logout();
    router.replace('/');
  }

  if (isLoading || !session) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color="#087f8c" />
        <ThemedText style={styles.loadingText}>در حال آماده‌سازی سامانه</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.eyebrow}>داشبورد مأمور گشت</ThemedText>
            <ThemedText type="subtitle" style={styles.greeting}>سلام {session.user.first_name}</ThemedText>
          </View>
          <Pressable accessibilityRole="button" onPress={logout} style={styles.logoutButton}>
            <ThemedText style={styles.logoutText}>خروج</ThemedText>
          </Pressable>
        </View>

        <View style={styles.statusRow}>
          <View style={styles.statusPill}>
            <View style={[styles.statusDot, connectivity?.status === 'offline' && styles.offlineDot]} />
            <ThemedText style={styles.statusText}>
              {connectivity?.status === 'offline' ? 'بدون اینترنت' : 'اتصال برقرار'}
            </ThemedText>
          </View>
          <ThemedText style={styles.personnelCode}>کد {session.user.personnel_code}</ThemedText>
        </View>

        <View style={styles.syncRow}>
          <ThemedText style={styles.syncText}>
            آخرین همگام‌سازی: {lastSyncAt ? new Date(lastSyncAt).toLocaleTimeString('fa-IR') : 'هنوز انجام نشده'}
          </ThemedText>
          <Pressable accessibilityRole="button" disabled={isRefreshing} onPress={refreshHome} style={styles.refreshButton}>
            <ThemedText style={styles.refreshText}>{isRefreshing ? 'در حال به‌روزرسانی' : 'به‌روزرسانی'}</ThemedText>
          </Pressable>
        </View>

        <View style={styles.shiftCard}>
          <ThemedText style={styles.cardLabel}>شیفت فعال</ThemedText>
          {shift ? (
            <>
              <ThemedText style={styles.cardTitle}>{shift.shift_type}</ThemedText>
              <ThemedText style={styles.cardDetail}>وضعیت: {shift.status}</ThemedText>
              {shift.vehicle && <ThemedText style={styles.cardDetail}>خودرو: {shift.vehicle.title}</ThemedText>}
              {shift.patrol_unit && <ThemedText style={styles.cardDetail}>واحد: {shift.patrol_unit.title}</ThemedText>}
            </>
          ) : (
            <ThemedText style={styles.cardDetail}>اطلاعات شیفت فعال در دسترس نیست.</ThemedText>
          )}
          {errorMessage && <ThemedText style={styles.error}>{errorMessage}</ThemedText>}
        </View>

        <Pressable accessibilityRole="button" onPress={() => router.push('/incident')} style={styles.incidentButton}>
          <ThemedText style={styles.incidentText}>ثبت حادثه جدید</ThemedText>
          <ThemedText style={styles.incidentHint}>ثبت گزارش حتی در حالت آفلاین</ThemedText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#f4f7f9', flex: 1 },
  centered: { alignItems: 'center', backgroundColor: '#f4f7f9', flex: 1, gap: 14, justifyContent: 'center' },
  loadingText: { color: '#607482', fontSize: 14 },
  content: { gap: 20, padding: 24 },
  header: { alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'space-between', paddingTop: 16 },
  eyebrow: { color: '#607482', fontSize: 14 },
  greeting: { color: '#123248', fontSize: 26, marginTop: 4 },
  logoutButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  logoutText: { color: '#b33a3a', fontWeight: '700' },
  statusRow: { alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'space-between' },
  statusPill: { alignItems: 'center', backgroundColor: '#e5f5ef', borderRadius: 20, flexDirection: 'row-reverse', gap: 7, paddingHorizontal: 12, paddingVertical: 8 },
  statusDot: { backgroundColor: '#217a5b', borderRadius: 5, height: 10, width: 10 },
  offlineDot: { backgroundColor: '#b33a3a' },
  statusText: { color: '#217a5b', fontSize: 13, fontWeight: '700' },
  personnelCode: { color: '#607482', fontSize: 13 },
  syncRow: { alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'space-between' },
  syncText: { color: '#607482', flex: 1, fontSize: 12, textAlign: 'right' },
  refreshButton: { justifyContent: 'center', minHeight: 44, paddingHorizontal: 8 },
  refreshText: { color: '#087f8c', fontSize: 13, fontWeight: '700' },
  shiftCard: { backgroundColor: '#ffffff', borderRadius: 16, gap: 8, padding: 20 },
  cardLabel: { color: '#607482', fontSize: 14 },
  cardTitle: { color: '#123248', fontSize: 24, fontWeight: '800' },
  cardDetail: { color: '#294858', fontSize: 15 },
  error: { color: '#b33a3a', fontSize: 13, marginTop: 4 },
  incidentButton: { backgroundColor: '#087f8c', borderRadius: 16, gap: 5, padding: 20 },
  incidentText: { color: '#ffffff', fontSize: 18, fontWeight: '800', textAlign: 'right' },
  incidentHint: { color: '#d8f1f3', fontSize: 13, textAlign: 'right' },
});