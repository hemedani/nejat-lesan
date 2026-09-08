import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fetchUnreadCount } from '@/api/announcements';
import { useRequiredSession } from '@/auth/use-required-session';
import { Badge } from '@/components/ui/badge';
import { AppTheme, Estedad, Radius, Shadow } from '@/constants/theme';
import {
  getUnreadCount,
  setUnreadCount,
  subscribeUnreadCount,
} from '@/components/unread-count-store';

type TabRoute = {
  key: string;
  name: string;
};

export type PatrolTabBarProps = {
  state: {
    index: number;
    routes: readonly TabRoute[];
  };
  navigation: {
    navigate: (name: string) => void;
    emit: (event: {
      type: string;
      target?: string;
      canPreventDefault?: boolean;
    }) => { defaultPrevented?: boolean };
  };
};

type TabDefinition = {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  focusedIcon: keyof typeof Ionicons.glyphMap;
  showUnreadBadge?: boolean;
};

const TAB_DEFINITIONS: TabDefinition[] = [
  { name: 'reports', label: 'گزارش‌ها', icon: 'document-text-outline', focusedIcon: 'document-text' },
  {
    name: 'announcements',
    label: 'اعلان‌ها',
    icon: 'notifications-outline',
    focusedIcon: 'notifications',
    showUnreadBadge: true,
  },
  { name: 'index', label: 'خانه', icon: 'home-outline', focusedIcon: 'home' },
  { name: 'map', label: 'نقشه', icon: 'map-outline', focusedIcon: 'map' },
  { name: 'more', label: 'راهنما', icon: 'help-circle-outline', focusedIcon: 'help-circle' },
];

export default function PatrolTabBar({ state, navigation }: PatrolTabBarProps) {
  const insets = useSafeAreaInsets();
  const session = useRequiredSession();
  const unreadCount = useSyncExternalStore(subscribeUnreadCount, getUnreadCount);
  const fetchingUnreadRef = useRef(false);

  useEffect(() => {
    if (!session || fetchingUnreadRef.current) {
      return;
    }
    fetchingUnreadRef.current = true;
    fetchUnreadCount(session)
      .then(next => setUnreadCount(next))
      .catch(() => undefined)
      .finally(() => {
        fetchingUnreadRef.current = false;
      });
  }, [session, state.index]);

  const orderedRoutes = TAB_DEFINITIONS.map(definition =>
    state.routes.find(route => route.name === definition.name),
  ).filter((route): route is TabRoute => Boolean(route));

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.dock}>
        {orderedRoutes.map(route => {
          const definition = TAB_DEFINITIONS.find(item => item.name === route.name);
          if (!definition) {
            return null;
          }
          const tabIndex = state.routes.findIndex(item => item.name === route.name);
          const isFocused = state.index === tabIndex;
          const isHome = route.name === 'index';
          const icon = isFocused ? definition.focusedIcon : definition.icon;
          const color = isFocused ? AppTheme.colors.primaryStrong : AppTheme.colors.textSecondary;

          function handlePress() {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          }

          return (
            <Pressable
              accessibilityLabel={definition.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              key={route.name}
              onPress={handlePress}
              style={({ pressed }) => [
                styles.tabButton,
                isHome && styles.homeTabButton,
                !isHome && isFocused && styles.tabButtonActive,
                pressed && styles.pressed,
              ]}
              testID={`tab-${route.name}`}
            >
              <View style={[styles.iconWrap, isHome && styles.homeIconWrap]}>
                <Ionicons
                  color={isHome ? AppTheme.colors.onPrimary : color}
                  name={icon}
                  size={isHome ? 26 : 23}
                />
                {definition.showUnreadBadge && unreadCount > 0 ? (
                  <View style={styles.badgeWrap}>
                    <Badge count={unreadCount} />
                  </View>
                ) : null}
              </View>
              <Text
                style={[
                  styles.label,
                  { color: isHome ? (isFocused ? AppTheme.colors.primaryStrong : AppTheme.colors.textSecondary) : color },
                  isFocused && styles.labelFocused,
                ]}
              >
                {definition.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: AppTheme.colors.background,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  dock: {
    backgroundColor: AppTheme.colors.surface,
    borderColor: AppTheme.colors.border,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row-reverse',
    paddingBottom: 6,
    paddingHorizontal: 6,
    paddingTop: 20,
    ...Shadow.floating,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
  tabButton: {
    alignItems: 'center',
    borderRadius: 18,
    flex: 1,
    gap: 3,
    justifyContent: 'flex-start',
    minHeight: 50,
    paddingTop: 4,
  },
  tabButtonActive: {
    backgroundColor: AppTheme.colors.primarySoft,
  },
  homeTabButton: {
    justifyContent: 'flex-start',
  },
  iconWrap: {
    alignItems: 'center',
    height: 30,
    justifyContent: 'center',
    width: 46,
  },
  homeIconWrap: {
    backgroundColor: AppTheme.colors.primary,
    borderColor: AppTheme.colors.background,
    borderRadius: 28,
    borderWidth: 4,
    height: 56,
    marginTop: -32,
    width: 56,
    ...Shadow.floating,
  },
  badgeWrap: {
    position: 'absolute',
    right: -4,
    top: -6,
  },
  label: {
    fontFamily: Estedad.medium,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  labelFocused: {
    fontFamily: Estedad.extraBold,
  },
});
