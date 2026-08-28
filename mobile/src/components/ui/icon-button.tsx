import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { AppTheme, Radius, Shadow } from '@/constants/theme';
import type { IconFamily, IconName } from '@/constants/icon-map';

import { Icon } from './icon';

export type IconButtonTone = 'plain' | 'primary' | 'danger';

export type IconButtonProps = {
  icon: IconName;
  iconFamily?: IconFamily;
  onPress: () => void;
  accessibilityLabel: string;
  tone?: IconButtonTone;
  size?: number;
  disabled?: boolean;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
};

const TONES: Record<IconButtonTone, { bg: string; fg: string }> = {
  plain: { bg: AppTheme.colors.surface, fg: AppTheme.colors.textSecondary },
  primary: { bg: AppTheme.colors.primarySoft, fg: AppTheme.colors.primaryStrong },
  danger: { bg: AppTheme.status.danger.bg, fg: AppTheme.status.danger.text },
};

export function IconButton({
  icon,
  iconFamily,
  onPress,
  accessibilityLabel,
  tone = 'plain',
  size = 48,
  disabled = false,
  elevated = false,
  style,
}: IconButtonProps) {
  const palette = TONES[tone];
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: palette.bg },
        elevated && Shadow.floating,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Icon color={palette.fg} family={iconFamily} name={icon} size={Math.round(size * 0.45)} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppTheme.colors.border,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.4,
  },
});
