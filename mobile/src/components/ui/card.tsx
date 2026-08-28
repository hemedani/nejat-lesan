import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { AppTheme, Estedad, Radius, Shadow } from '@/constants/theme';
import type { IconFamily, IconName } from '@/constants/icon-map';

import { Icon } from './icon';

export function Card({
  children,
  variant = 'default',
  style,
}: {
  children: ReactNode;
  variant?: 'default' | 'flat' | 'outlined';
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        styles.base,
        variant === 'default' && styles.default,
        variant === 'outlined' && styles.outlined,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function CardHeader({
  title,
  icon,
  iconFamily,
  action,
  tone = 'primary',
}: {
  title: string;
  icon?: IconName;
  iconFamily?: IconFamily;
  action?: ReactNode;
  tone?: 'primary' | 'strong';
}) {
  return (
    <View style={styles.header}>
      {icon ? (
        <View style={styles.iconBadge}>
          <Icon
            color={tone === 'primary' ? AppTheme.colors.primaryStrong : AppTheme.colors.textBody}
            family={iconFamily}
            name={icon}
            size={18}
          />
        </View>
      ) : null}
      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: AppTheme.colors.surface,
    borderRadius: Radius.lg,
    padding: 16,
  },
  default: {
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
    ...Shadow.card,
  },
  outlined: {
    borderWidth: 1,
    borderColor: AppTheme.colors.borderStrong,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 10,
    marginBottom: 12,
  },
  iconBadge: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.primarySoft,
    borderRadius: Radius.sm,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  title: {
    color: AppTheme.colors.textStrong,
    flex: 1,
    fontFamily: Estedad.semiBold,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'right',
  },
});
