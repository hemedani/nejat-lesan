import { StyleSheet, Text, View } from 'react-native';

import { AppTheme, Estedad, Radius } from '@/constants/theme';
import type { IconFamily, IconName } from '@/constants/icon-map';

import { Button } from './button';
import { Icon } from './icon';

export type EmptyStateProps = {
  icon: IconName;
  iconFamily?: IconFamily;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon, iconFamily, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Icon color={AppTheme.colors.primaryStrong} family={iconFamily} name={icon} size={32} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} size="md" variant="soft" style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    alignSelf: 'center',
    marginTop: 8,
    paddingHorizontal: 24,
  },
  container: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  description: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 14,
    lineHeight: 22,
    maxWidth: 300,
    textAlign: 'center',
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.primarySoft,
    borderRadius: Radius.pill,
    height: 76,
    justifyContent: 'center',
    marginBottom: 4,
    width: 76,
  },
  title: {
    color: AppTheme.colors.textStrong,
    fontFamily: Estedad.bold,
    fontSize: 16,
    lineHeight: 25,
    textAlign: 'center',
  },
});
