import { useEffect, useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import type { IconFamily, IconName } from '@/constants/icon-map';
import { AppTheme, Motion, Radius } from '@/constants/theme';

import { Icon } from './icon';

export type StepperStep = {
  key: string;
  label: string;
  icon: IconName;
  family?: IconFamily;
};

export function StepperHeader({
  steps,
  currentIndex,
}: {
  steps: StepperStep[];
  currentIndex: number;
}) {
  const progress = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    Animated.timing(progress, {
      duration: Motion.base,
      toValue: Math.min(1, Math.max(0, (currentIndex + 1) / steps.length)),
      useNativeDriver: false,
    }).start();
  }, [currentIndex, progress, steps.length]);

  const fillWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View accessibilityRole="progressbar" accessibilityState={{ busy: false }} style={styles.container}>
      <View style={styles.stepsRow}>
        {steps.map((step, index) => {
          const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming';
          return (
            <View key={step.key} style={styles.stepGroup}>
              {index > 0 ? <View style={[styles.connector, index <= currentIndex && styles.connectorActive]} /> : null}
              <View
                accessible
                accessibilityLabel={`مرحله ${(index + 1).toLocaleString('fa-IR')}: ${step.label}`}
                style={[
                  styles.dot,
                  state === 'done' && styles.dotDone,
                  state === 'current' && styles.dotCurrent,
                  state === 'upcoming' && styles.dotUpcoming,
                ]}
              >
                <Icon
                  color={
                    state === 'current'
                      ? AppTheme.colors.onPrimary
                      : state === 'done'
                        ? AppTheme.colors.primaryStrong
                        : AppTheme.colors.textFaint
                  }
                  family={step.family}
                  name={state === 'done' ? 'checkmark' : step.icon}
                  size={14}
                />
              </View>
            </View>
          );
        })}
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width: fillWidth }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    width: '100%',
  },
  connector: {
    backgroundColor: AppTheme.colors.border,
    flex: 1,
    height: 2,
    borderRadius: Radius.pill,
  },
  connectorActive: {
    backgroundColor: AppTheme.colors.primaryBorder,
  },
  dot: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  dotDone: {
    backgroundColor: AppTheme.colors.primarySoft,
    borderColor: AppTheme.colors.primaryBorder,
    borderWidth: 1,
  },
  dotCurrent: {
    backgroundColor: AppTheme.colors.primary,
  },
  dotUpcoming: {
    backgroundColor: AppTheme.colors.surfaceSunken,
  },
  fill: {
    backgroundColor: AppTheme.colors.primary,
    height: '100%',
    borderRadius: Radius.pill,
  },
  stepGroup: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    flex: 1,
    gap: 4,
  },
  stepsRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
  },
  track: {
    backgroundColor: AppTheme.colors.surfaceSunken,
    borderRadius: Radius.pill,
    height: 6,
    overflow: 'hidden',
  },
});
