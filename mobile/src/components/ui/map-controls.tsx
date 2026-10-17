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

/**
 * Zoom / locate cluster.
 *
 * One connected rounded pill rather than three floating circles: a detached
 * control per action is three shadowed shapes competing with the map for
 * attention, and it reads as three unrelated buttons. Joined, they read as one
 * instrument, and the divider keeps each target unambiguously 48dp.
 */
export function MapControls({
  onZoomIn,
  onZoomOut,
  onLocate,
  locateLoading = false,
  locateActive = false,
  locateDisabled = false,
  style,
}: MapControlsProps) {
  const items = [
    onZoomIn ? (
      <MapControlButton key="in" accessibilityLabel="بزرگ‌نمایی" icon="add" onPress={onZoomIn} />
    ) : null,
    onZoomOut ? (
      <MapControlButton key="out" accessibilityLabel="کوچک‌نمایی" icon="remove" onPress={onZoomOut} />
    ) : null,
    onLocate ? (
      <Pressable
        key="locate"
        accessibilityLabel="موقعیت فعلی من"
        accessibilityRole="button"
        disabled={locateDisabled || locateLoading}
        onPress={onLocate}
        style={({ pressed }) => [
          styles.cell,
          styles.lastCell,
          (locateActive || pressed) && !locateDisabled && styles.cellActive,
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
    ) : null,
  ].filter(Boolean);

  if (items.length === 0) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={[styles.container, style]}>
      <View style={[styles.cluster, Shadow.floating]}>{items}</View>
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
      style={({ pressed }) => [styles.cell, styles.divider, pressed && styles.cellPressed]}
    >
      <Icon color={AppTheme.colors.textSecondary} name={icon} size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  cluster: {
    backgroundColor: AppTheme.colors.surface,
    borderColor: AppTheme.colors.border,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  cell: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  // Hairline between stacked cells: separates targets without adding a second
  // border, which a per-cell one would render doubled against the clip.
  divider: {
    borderBottomColor: AppTheme.colors.hairline,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lastCell: {
    borderBottomWidth: 0,
  },
  cellActive: {
    backgroundColor: AppTheme.colors.primarySoft,
  },
  cellPressed: {
    backgroundColor: AppTheme.colors.surfaceMuted,
  },
  disabled: {
    opacity: 0.5,
  },
});