import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppTheme, Estedad, type StatusTone } from '@/constants/theme';
import type { IconFamily, IconName } from '@/constants/icon-map';

import { Icon } from './icon';

export type StatusPillProps = {
  label: string;
  tone?: StatusTone | 'primary';
  icon?: IconName;
  iconFamily?: IconFamily;
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function StatusPill({ label, tone = 'neutral', icon, iconFamily, dot = false, style }: StatusPillProps) {
  const palette =
    tone === 'primary'
      ? { bg: AppTheme.colors.primarySoft, border: AppTheme.colors.primaryBorder, text: AppTheme.colors.primaryStrong }
      : AppTheme.status[tone];

  return (
    <View style={[styles.base, { backgroundColor: palette.bg, borderColor: palette.border }, style]}>
      {icon ? <Icon color={palette.text} family={iconFamily} name={icon} size={14} /> : null}
      {dot && !icon ? <View style={[styles.dot, { backgroundColor: palette.text }]} /> : null}
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: 'transparent',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    flexShrink: 1,
    gap: 6,
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dot: {
    borderRadius: 4,
    flexShrink: 0,
    height: 8,
    width: 8,
  },
  label: {
    flexShrink: 1,
    fontFamily: Estedad.semiBold,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
