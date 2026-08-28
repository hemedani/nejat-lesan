import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';import { Animated, StyleSheet, Text, View } from 'react-native';

import { AppTheme, BottomTabInset, Estedad, Motion, Radius, Shadow } from '@/constants/theme';
import type { StatusTone } from '@/constants/theme';

import { Icon } from './icon';

type ToastTone = Extract<StatusTone, 'success' | 'info' | 'danger'>;

type ToastPayload = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  show: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_ICONS: Record<ToastTone, { name: import('@/constants/icon-map').IconName; family: import('@/constants/icon-map').IconFamily }> = {
  success: { name: 'checkmark-circle', family: 'ion' },
  info: { name: 'information-circle-outline', family: 'ion' },
  danger: { name: 'alert-circle', family: 'ion' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const animation = useMemo(() => new Animated.Value(0), []);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counter = useRef(0);

  const hide = useCallback(() => {
    Animated.timing(animation, { toValue: 0, duration: Motion.fast, useNativeDriver: true }).start(() =>
      setToast(null),
    );
  }, [animation]);

  const show = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      counter.current += 1;
      if (timer.current) {
        clearTimeout(timer.current);
      }
      setToast({ id: counter.current, message, tone });
      Animated.timing(animation, { toValue: 1, duration: Motion.base, useNativeDriver: true }).start();
      timer.current = setTimeout(hide, 3200);
    },
    [animation, hide],
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          accessibilityLiveRegion="polite"
          pointerEvents="none"
          style={[
            styles.host,
            Shadow.floating,
            { opacity: animation, transform: [{ translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] },
          ]}
          key={toast.id}
        >
          <View style={styles.card}>
            <Icon
              color={AppTheme.status[toast.tone].text}
              family={TONE_ICONS[toast.tone].family}
              name={TONE_ICONS[toast.tone].name}
              size={20}
            />
            <Text style={styles.message}>{toast.message}</Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  host: {
    alignSelf: 'center',
    bottom: BottomTabInset + 24,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 100,
  },
  card: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.surface,
    borderColor: AppTheme.colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: 10,
    marginHorizontal: 24,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  message: {
    color: AppTheme.colors.textBody,
    flex: 1,
    fontFamily: Estedad.medium,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'right',
  },
});
