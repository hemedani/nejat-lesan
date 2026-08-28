import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppTheme, Estedad, Radius } from '@/constants/theme';
import type { IconFamily, IconName } from '@/constants/icon-map';

import { Icon } from './icon';

export type ButtonVariant = 'solid' | 'soft' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconFamily?: IconFamily;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

const HEIGHTS: Record<ButtonSize, number> = { md: 48, lg: 56 };

export function Button({
  label,
  onPress,
  variant = 'solid',
  size = 'md',
  icon,
  iconFamily,
  loading = false,
  disabled = false,
  fullWidth = false,
  accessibilityLabel,
  style,
}: ButtonProps) {
  const palette = variantStyles[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { height: HEIGHTS[size], borderRadius: size === 'lg' ? Radius.md : Radius.md },
        palette.container,
        pressed && !inactive && palette.pressed,
        inactive && styles.disabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.spinner} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon color={palette.text} family={iconFamily} name={icon} size={size === 'lg' ? 22 : 20} /> : null}
          <Text style={[styles.label, { color: palette.text }, size === 'lg' && styles.labelLarge]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const variantStyles: Record<
  ButtonVariant,
  { container: ViewStyle; text: string; pressed: ViewStyle; spinner: string }
> = {
  solid: {
    container: { backgroundColor: AppTheme.colors.primary },
    text: AppTheme.colors.onPrimary,
    pressed: { backgroundColor: AppTheme.colors.primaryStrong },
    spinner: AppTheme.colors.onPrimary,
  },
  soft: {
    container: { backgroundColor: AppTheme.colors.primarySoft },
    text: AppTheme.colors.primaryStrong,
    pressed: { backgroundColor: '#d4eaed' },
    spinner: AppTheme.colors.primaryStrong,
  },
  outline: {
    container: {
      backgroundColor: AppTheme.colors.surface,
      borderWidth: 1,
      borderColor: AppTheme.colors.primaryBorder,
    },
    text: AppTheme.colors.primaryStrong,
    pressed: { backgroundColor: AppTheme.colors.primarySoft },
    spinner: AppTheme.colors.primaryStrong,
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: AppTheme.colors.primaryStrong,
    pressed: { backgroundColor: AppTheme.colors.surfaceMuted },
    spinner: AppTheme.colors.primaryStrong,
  },
  danger: {
    container: { backgroundColor: AppTheme.status.danger.text },
    text: AppTheme.colors.onPrimary,
    pressed: { backgroundColor: '#99302f' },
    spinner: AppTheme.colors.onPrimary,
  },
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 18,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 8,
  },
  label: {
    fontFamily: Estedad.semiBold,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  labelLarge: {
    fontSize: 17,
    lineHeight: 26,
  },
  disabled: {
    opacity: 0.45,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
});
