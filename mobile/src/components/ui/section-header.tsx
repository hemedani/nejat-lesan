import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppTheme, Estedad } from '@/constants/theme';
import type { IconFamily, IconName } from '@/constants/icon-map';

import { Icon } from './icon';

export type SectionHeaderProps = {
  title: string;
  icon?: IconName;
  iconFamily?: IconFamily;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({ title, icon, iconFamily, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      {icon ? <Icon color={AppTheme.colors.primaryStrong} family={iconFamily} name={icon} size={20} /> : null}
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" hitSlop={8} onPress={onAction} style={styles.action}>
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 6,
  },
  actionLabel: {
    color: AppTheme.colors.primaryStrong,
    fontFamily: Estedad.semiBold,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'right',
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 12,
    marginTop: 4,
  },
  title: {
    color: AppTheme.colors.textStrong,
    flex: 1,
    fontFamily: Estedad.bold,
    fontSize: 16,
    lineHeight: 25,
    textAlign: 'right',
  },
});
