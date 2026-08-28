import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppTheme, Radius, Shadow } from '@/constants/theme';

import { Icon } from './icon';

export type MapControlsProps = {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onLocate?: () => void;
  locateLoading?: boolean;
  locateActive?: boolean;
  locateDisabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function MapControls({
  onZoomIn,
  onZoomOut,
  onLocate,
  locateLoading = false,
  locateActive = false,
  locateDisabled = false,
  style,
}: MapControlsProps) {
  return (
    <View pointerEvents="box-none" style={[styles.container, style]}>
      {onZoomIn ? (
        <MapControlButton accessibilityLabel="بزرگ‌نمایی" icon="add" onPress={onZoomIn} />
      ) : null}
      {onZoomOut ? (
        <MapControlButton accessibilityLabel="کوچک‌نمایی" icon="remove" onPress={onZoomOut} />
      ) : null}
      {onLocate ? (
        <Pressable
          accessibilityLabel="موقعیت فعلی من"
          accessibilityRole="button"
          disabled={locateDisabled || locateLoading}
          onPress={onLocate}
          style={({ pressed }) => [
            styles.button,
            (locateActive || pressed) && !locateDisabled && styles.buttonActive,
            locateDisabled && styles.disabled,
          ]}
        >
          {locateLoading ? (
            <ActivityIndicator color={AppTheme.colors.primaryStrong} size="small" />
          ) : (
            <Icon
              color={locateActive ? AppTheme.colors.primaryStrong : AppTheme.colors.textSecondary}
              name="locate"
              size={22}
            />
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

function MapControlButton({
  icon,
  onPress,
  accessibilityLabel,
}: {
  icon: import('@/constants/icon-map').IconName;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Icon color={AppTheme.colors.textSecondary} name={icon} size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 10,
  },
  button: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.surface,
    borderColor: AppTheme.colors.border,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    height: 48,
    justifyContent: 'center',
    width: 48,
    ...Shadow.floating,
  },
  buttonActive: {
    backgroundColor: AppTheme.colors.primarySoft,
    borderColor: AppTheme.colors.primaryBorder,
  },
  pressed: {
    backgroundColor: AppTheme.colors.surfaceMuted,
  },
  disabled: {
    opacity: 0.5,
  },
});
