import { StyleSheet, Text, View } from 'react-native';

import { AppTheme, Estedad, type StatusTone } from '@/constants/theme';

export type BadgeProps = {
  count?: number;
  dot?: boolean;
  tone?: StatusTone | 'primary';
};

export function formatBadgeCount(count: number): string {
  if (count > 99) {
    return '+۹۹';
  }
  return count.toLocaleString('fa-IR');
}

export function Badge({ count = 0, dot = false, tone = 'danger' }: BadgeProps) {
  const palette =
    tone === 'primary'
      ? { bg: AppTheme.colors.primary, text: AppTheme.colors.onPrimary }
      : { bg: AppTheme.status[tone].text, text: AppTheme.colors.onPrimary };

  if (dot) {
    return <View style={[styles.dot, { backgroundColor: palette.bg }]} />;
  }

  if (count <= 0) {
    return null;
  }

  return (
    <View style={[styles.base, { backgroundColor: palette.bg }]}>
      <Text style={[styles.label, { color: palette.text }]}>{formatBadgeCount(count)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 20,
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  label: {
    fontFamily: Estedad.semiBold,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
});
