import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { AppTheme, Estedad, Radius, type StatusTone } from '@/constants/theme';
import type { IconFamily, IconName } from '@/constants/icon-map';

import { Icon } from './icon';

export type BannerProps = {
  tone?: StatusTone;
  icon?: IconName;
  iconFamily?: IconFamily;
  message: string;
  title?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

const FALLBACK_ICONS: Record<StatusTone, { name: IconName; family: IconFamily }> = {
  success: { name: 'checkmark-circle', family: 'ion' },
  warning: { name: 'warning-outline', family: 'ion' },
  danger: { name: 'alert-circle', family: 'ion' },
  info: { name: 'information-circle-outline', family: 'ion' },
  neutral: { name: 'information-circle-outline', family: 'ion' },
};

export function Banner({
  tone = 'info',
  icon,
  iconFamily,
  message,
  title,
  actionLabel,
  onAction,
  style,
  children,
}: BannerProps) {
  const palette = AppTheme.status[tone];
  const deep = 'deep' in palette ? palette.deep : palette.text;
  const resolvedIcon = icon ?? FALLBACK_ICONS[tone].name;

  return (
    <View style={[styles.base, { backgroundColor: palette.bg, borderColor: palette.border }, style]}>
      <Icon color={deep} family={iconFamily ?? FALLBACK_ICONS[tone].family} name={resolvedIcon} size={20} />
      <View style={styles.copy}>
        {title ? (
          <Text style={[styles.title, { color: deep }]}>{title}</Text>
        ) : null}
        <Text style={[styles.message, { color: AppTheme.colors.textBody }]}>{message}</Text>
        {children}
      </View>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8} style={styles.action}>
          <Text style={[styles.actionLabel, { color: palette.text }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'flex-start',
    borderColor: 'transparent',
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: 10,
    padding: 12,
  },
  action: {
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 4,
  },
  actionLabel: {
    fontFamily: Estedad.semiBold,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'right',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  message: {
    fontFamily: Estedad.regular,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
  },
  title: {
    fontFamily: Estedad.semiBold,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'right',
  },
});
