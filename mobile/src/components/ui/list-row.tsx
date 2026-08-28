import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { AppTheme, Estedad } from '@/constants/theme';
import type { IconFamily, IconName } from '@/constants/icon-map';

import { Icon } from './icon';

export type ListRowProps = {
  title: string;
  subtitle?: string;
  icon?: IconName;
  iconFamily?: IconFamily;
  iconTone?: 'primary' | 'neutral' | 'danger';
  trailing?: ReactNode;
  showChevron?: boolean;
  danger?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

const ICON_TONES = {
  primary: AppTheme.colors.primaryStrong,
  neutral: AppTheme.colors.textSecondary,
  danger: AppTheme.status.danger.text,
} as const;

export function ListRow({
  title,
  subtitle,
  icon,
  iconFamily,
  iconTone = 'primary',
  trailing,
  showChevron = false,
  danger = false,
  disabled = false,
  onPress,
  style,
}: ListRowProps) {
  const content = (
    <View style={styles.row}>
      {icon ? (
        <View style={[styles.iconBadge, danger && styles.iconBadgeDanger]}>
          <Icon color={danger ? ICON_TONES.danger : ICON_TONES[iconTone]} family={iconFamily} name={icon} size={20} />
        </View>
      ) : null}
      <View style={styles.copy}>
        <Text numberOfLines={1} style={[styles.title, danger && { color: ICON_TONES.danger }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      {showChevron ? <Icon color={AppTheme.colors.textFaint} name="chevron-back" size={18} /> : null}
    </View>
  );

  if (!onPress) {
    return <View style={[styles.container, style]}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && !disabled && styles.pressed, style]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    minHeight: 56,
    justifyContent: 'center',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 12,
  },
  copy: {
    flex: 1,
    gap: 2,
    justifyContent: 'center',
  },
  iconBadge: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.primarySoft,
    borderRadius: 12,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  iconBadgeDanger: {
    backgroundColor: AppTheme.status.danger.bg,
  },
  pressed: {
    backgroundColor: AppTheme.colors.surfaceMuted,
  },
  subtitle: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'right',
  },
  title: {
    color: AppTheme.colors.textStrong,
    fontFamily: Estedad.semiBold,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'right',
  },
});
