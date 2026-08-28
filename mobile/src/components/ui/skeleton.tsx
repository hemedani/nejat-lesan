import { useEffect, useMemo } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppTheme, Radius } from '@/constants/theme';

export function SkeletonLine({
  width,
  height = 12,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = usePulse();
  return <Animated.View style={[styles.line, { width: width ?? '100%', height, opacity }, style]} />;
}

export function SkeletonCard({ height = 96 }: { height?: number }) {
  const opacity = usePulse();
  return (
    <View style={[styles.card, { height }]}>
      <Animated.View style={[styles.cardInner, { opacity }]}>
        <SkeletonLine width="40%" height={14} />
        <SkeletonLine width="85%" />
        <SkeletonLine width="60%" />
      </Animated.View>
    </View>
  );
}

export function SkeletonList({ rows = 3, rowHeight = 88 }: { rows?: number; rowHeight?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: rows }, (_, index) => (
        <SkeletonCard height={rowHeight} key={index} />
      ))}
    </View>
  );
}

function usePulse() {
  const value = useMemo(() => new Animated.Value(0.45), []);
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(value, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [value]);
  return value;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppTheme.colors.surfaceSunken,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  cardInner: {
    gap: 10,
    padding: 16,
  },
  line: {
    backgroundColor: AppTheme.colors.surfaceSunken,
    borderRadius: Radius.sm,
  },
  list: {
    gap: 12,
  },
});
