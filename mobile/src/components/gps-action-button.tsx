import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcons } from '@/constants/icon-map';
import { AppTheme, Estedad, Radius } from '@/constants/theme';
import type { useDeviceLocation } from '@/hooks/use-device-location';

import { Icon } from './ui/icon';

type DeviceLocation = ReturnType<typeof useDeviceLocation>;

/**
 * The «فعال‌سازی GPS» action shown on every screen that needs the officer's
 * position while that position is unavailable. Renders a locating spinner
 * until a fix exists; hides itself once GPS is healthy.
 */
export function GpsActionButton({
  device,
  variant = 'solid',
}: {
  device: DeviceLocation;
  variant?: 'solid' | 'outline';
}) {
  if (device.status === 'granted') {
    return null;
  }
  if (device.status === 'locating' && !device.coords) {
    return (
      <View style={[styles.base, styles[variant]]} pointerEvents="none">
        <ActivityIndicator color={AppTheme.colors.primaryStrong} />
        <Text style={styles.labelOutline}>در حال دریافت موقعیت…</Text>
      </View>
    );
  }
  const action = device.recoveryAction;
  if (!action) {
    return null;
  }
  const iconColor = variant === 'solid' ? AppTheme.colors.onPrimary : AppTheme.colors.primaryStrong;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action.label}
      onPress={action.run}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
      ]}
    >
      <Icon color={iconColor} family={AppIcons.map.locateMe.family} name={AppIcons.map.locateMe.name} size={17} />
      <Text style={variant === 'solid' ? styles.labelSolid : styles.labelOutline}>
        {action.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: Radius.md,
    flexDirection: 'row-reverse',
    gap: 8,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  solid: { backgroundColor: AppTheme.colors.primary },
  outline: { backgroundColor: AppTheme.colors.surface, borderColor: AppTheme.colors.primaryBorder, borderWidth: 1 },
  labelSolid: {
    color: AppTheme.colors.onPrimary,
    fontFamily: Estedad.semiBold,
    fontSize: 14,
    lineHeight: 21,
  },
  labelOutline: {
    color: AppTheme.colors.primaryStrong,
    fontFamily: Estedad.semiBold,
    fontSize: 14,
    lineHeight: 21,
  },
  pressed: { opacity: 0.85 },
});
