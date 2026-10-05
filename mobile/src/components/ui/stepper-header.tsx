import { useEffect, useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import type { IconFamily, IconName } from '@/constants/icon-map';
import { AppTheme, Motion, Radius } from '@/constants/theme';

import { FormIcon, isFormIconAvailable } from '@/components/form/form-icon';

import { Icon } from './icon';

export type StepperStep = {
  key: string;
  label: string;
  /** An Ionicons / MaterialCommunityIcons / Feather name. */
  icon?: IconName;
  family?: IconFamily;
  /**
   * A shared form-engine icon name (`FORM_ICON_NAMES` from `@forms`).
   *
   * A form definition carries its own icon vocabulary (`mapPin`, `fileText`,
   * `sun`, …) which is *not* an Ionicons name. Handing one to `Icon` draws
   * nothing and logs `"mapPin" is not a valid icon name for family "ionicons"`,
   * so it goes through `FormIcon` instead. Takes precedence over `icon` when it
   * resolves to a known name.
   */
  formIcon?: string | null;
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
          const color =
            state === 'current'
              ? AppTheme.colors.onPrimary
              : state === 'done'
                ? AppTheme.colors.primaryStrong
                : AppTheme.colors.textFaint;
          // A completed step always shows a checkmark, whatever the step declared.
          const showFormIcon = state !== 'done' && isFormIconAvailable(step.formIcon);
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
                {showFormIcon ? (
                  <FormIcon color={color} name={step.formIcon} size={14} />
                ) : (
                  <Icon
                    color={color}
                    family={step.family}
                    name={state === 'done' ? 'checkmark' : step.icon ?? 'clipboard-outline'}
                    size={14}
                  />
                )}
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
