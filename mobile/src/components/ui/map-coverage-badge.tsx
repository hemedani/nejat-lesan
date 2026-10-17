import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import type { MapCoverage } from '@/domain/map-coverage';
import { coverageBadgeCopy } from '@/domain/map-coverage-copy';
import { AppTheme, Estedad, Radius, Shadow } from '@/constants/theme';

export type MapCoverageBadgeProps = {
  coverage: MapCoverage | null;
  /** Whether the requested tile level is fully backed by disk. */
  covered: boolean;
  /** True while the device has no usable network. */
  offline?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Tells the officer, in one line, whether the map under their finger came off
 * the device.
 *
 * The alternative was silence, and silence was worse: the first version
 * reported "آفلاین آماده" at every zoom because the tile-level clamp guarantees
 * *something* is drawn, so an online officer was told their map was offline-ready
 * while looking at a 128x upscale. The label has to describe the requested
 * depth, not the fact that pixels appeared.
 */
export function MapCoverageBadge({ coverage, covered, offline = false, style }: MapCoverageBadgeProps) {
  const { label, tone } = coverageBadgeCopy({ coverage, covered, offline });
  return (
    <View style={[styles.badge, Shadow.floating, style]}>
      <View style={[styles.dot, { backgroundColor: AppTheme.status[tone].text }]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: AppTheme.colors.surface,
    borderColor: AppTheme.colors.border,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row-reverse',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dot: {
    borderRadius: Radius.pill,
    height: 7,
    width: 7,
  },
  label: {
    color: AppTheme.colors.textBody,
    fontFamily: Estedad.medium,
    fontSize: 11.5,
    lineHeight: 17,
  },
});