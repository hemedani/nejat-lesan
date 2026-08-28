import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { AppTheme, Estedad } from '@/constants/theme';
import type { IconFamily, IconName } from '@/constants/icon-map';

import { Icon } from './icon';

export type ChoiceChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconName;
  iconFamily?: IconFamily;
  showCheck?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ChoiceChip({
  label,
  selected,
  onPress,
  icon,
  iconFamily,
  showCheck = true,
  disabled = false,
  style,
}: ChoiceChipProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        selected ? styles.selected : styles.unselected,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon ? (
        <Icon
          color={selected ? AppTheme.colors.primaryStrong : AppTheme.colors.textSecondary}
          family={iconFamily}
          name={icon}
          size={17}
        />
      ) : null}
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          { color: selected ? AppTheme.colors.primaryStrong : AppTheme.colors.textBody },
          !icon && !selected && showCheck === false && styles.labelPlain,
        ]}
      >
        {label}
      </Text>
      {!icon && selected && showCheck ? (
        <Icon color={AppTheme.colors.primaryStrong} name="checkmark" size={15} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderColor: AppTheme.colors.borderStrong,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontFamily: Estedad.medium,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'right',
  },
  labelPlain: {
    fontFamily: Estedad.regular,
  },
  pressed: {
    opacity: 0.85,
  },
  selected: {
    backgroundColor: AppTheme.colors.primarySoft,
    borderColor: AppTheme.colors.primaryBorder,
  },
  unselected: {
    backgroundColor: AppTheme.colors.surface,
    borderColor: AppTheme.colors.borderStrong,
  },
});
