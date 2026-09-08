import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError } from '@/api/errors';
import { getActiveShift } from '@/api/shift';
import { createSessionService, type SessionService } from '@/auth/session-service';
import { isIncidentPatrolEnabled, moduleDisabledMessage } from '@/domain/modules';
import type { ActiveShift, Session } from '@/domain/types';
import {
  getConnectivitySnapshot,
  subscribeToConnectivity,
  type ConnectivitySnapshot,
} from '@/services/connectivity';

const NO_ACTIVE_SHIFT_MESSAGE = 'شیفت فعالی یافت نشد';
const AUTO_REFRESH_COOLDOWN_MS = 60_000;

const defaultSessionService = createSessionService();

export function isNoActiveShiftError(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.code !== 'validation') {
    return false;
  }
  const details = error.details as { message?: unknown } | null | undefined;
  return typeof details?.message === 'string' && details.message.includes(NO_ACTIVE_SHIFT_MESSAGE);
}

export type ActiveShiftState = 'loading' | 'active' | 'no_active_shift' | 'unavailable';

export type UseActiveShiftResult = {
  session: Session | null;
  shift: ActiveShift | null;
  shiftState: ActiveShiftState;
  connectivity: ConnectivitySnapshot | null;
  isLoading: boolean;
  isRefreshing: boolean;
  lastSyncAt: string | null;
  errorMessage: string | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

export function useActiveShift(
  translate: (error: unknown) => string,
  sessionService: SessionService = defaultSessionService,
): UseActiveShiftResult {
  const [session, setSession] = useState<Session | null>(null);
  const [shift, setShift] = useState<ActiveShift | null>(null);
  const [shiftState, setShiftState] = useState<ActiveShiftState>('loading');
  const [connectivity, setConnectivity] = useState<ConnectivitySnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sessionRef = useRef<Session | null>(null);
  const inFlightRef = useRef(false);
  const lastAutoRefreshAtRef = useRef(0);

  const applyResult = useCallback(async (activeShift: ActiveShift) => {
    setShift(activeShift);
    setShiftState('active');
    setErrorMessage(null);
    await sessionService.updateLastSync();
    setLastSyncAt(new Date().toISOString());
  }, [sessionService]);

  const fetchShift = useCallback(
    async (restoredSession: Session): Promise<boolean> => {
      if (inFlightRef.current) {
        return false;
      }
      inFlightRef.current = true;
      try {
        if (!isIncidentPatrolEnabled(restoredSession)) {
          // Module-owned surface: show the Persian module notice instead of
          // firing a dead `shift.*` call (Ghost is exempt; backend enforces).
          setShift(null);
          setShiftState('unavailable');
          setErrorMessage(moduleDisabledMessage(restoredSession));
          return false;
        }
        const snapshot = await getConnectivitySnapshot();
        if (snapshot.status === 'offline') {
          return false;
        }
        const activeShift = await getActiveShift(restoredSession, { set: {}, get: {} });
        await applyResult(activeShift);
        return true;
      } catch (error) {
        if (isNoActiveShiftError(error)) {
          setShift(null);
          setShiftState('no_active_shift');
          setErrorMessage(null);
        } else {
          setShiftState(state => (state === 'active' ? state : 'unavailable'));
          setErrorMessage(translate(error));
        }
        return false;
      } finally {
        inFlightRef.current = false;
      }
    },
    [applyResult, translate],
  );

  const refresh = useCallback(async () => {
    const restoredSession = sessionRef.current;
    if (!restoredSession || inFlightRef.current || isRefreshing) {
      return;
    }
    setIsRefreshing(true);
    try {
      const snapshot = await getConnectivitySnapshot();
      setConnectivity(snapshot);
      await fetchShift(restoredSession);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchShift, isRefreshing]);

  useEffect(() => {
    let mounted = true;
    let didRestore = false;

    async function restore() {
      if (didRestore) {
        return;
      }
      didRestore = true;
      const restoredSession = await sessionService.restore();
      if (!mounted) {
        return;
      }
      if (!restoredSession) {
        setSession(null);
        setIsLoading(false);
        return;
      }
      sessionRef.current = restoredSession;
      setSession(restoredSession);
      const snapshot = await getConnectivitySnapshot();
      if (!mounted) {
        return;
      }
      setConnectivity(snapshot);
      await fetchShift(restoredSession);
      if (mounted) {
        setIsLoading(false);
      }
    }

    restore();
    const unsubscribe = subscribeToConnectivity(snapshot => {
      if (!mounted) {
        return;
      }
      setConnectivity(snapshot);
      if (snapshot.status === 'offline') {
        return;
      }
      const now = Date.now();
      if (now - lastAutoRefreshAtRef.current < AUTO_REFRESH_COOLDOWN_MS) {
        return;
      }
      lastAutoRefreshAtRef.current = now;
      if (sessionRef.current) {
        void fetchShift(sessionRef.current);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [fetchShift, sessionService]);

  const logout = useCallback(async () => {
    await sessionService.logout();
    sessionRef.current = null;
    setSession(null);
  }, [sessionService]);

  return {
    session,
    shift,
    shiftState,
    connectivity,
    isLoading,
    isRefreshing,
    lastSyncAt,
    errorMessage,
    refresh,
    logout,
  };
}
