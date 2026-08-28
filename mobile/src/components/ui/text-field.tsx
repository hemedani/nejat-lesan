import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { AppTheme, Estedad, Radius } from '@/constants/theme';
import type { IconFamily, IconName } from '@/constants/icon-map';

import { Icon } from './icon';
import { IconButton } from './icon-button';

export type TextFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  label?: string;
  placeholder?: string;
  hint?: string;
  error?: string | null;
  icon?: IconName;
  iconFamily?: IconFamily;
  secure?: boolean;
  ltr?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  minHeight?: number;
  editable?: boolean;
  maxLength?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

export function TextField({
  value,
  onChangeText,
  label,
  placeholder,
  hint,
  error,
  icon,
  iconFamily,
  secure = false,
  ltr = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  multiline = false,
  numberOfLines,
  minHeight,
  editable = true,
  maxLength,
  accessibilityLabel,
  style,
  inputStyle,
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(!secure);

  const borderColor = error
    ? AppTheme.status.danger.border
    : focused
      ? AppTheme.colors.primaryBorder
      : AppTheme.colors.borderStrong;

  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.field, { borderColor }, !editable && styles.disabled]}>
        {icon ? (
          <Icon
            color={error ? AppTheme.status.danger.text : focused ? AppTheme.colors.primaryStrong : AppTheme.colors.textFaint}
            family={iconFamily}
            name={icon}
            size={19}
          />
        ) : null}
        <TextInput
          accessibilityLabel={accessibilityLabel ?? label}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={editable}
          keyboardType={keyboardType}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onBlur={() => setFocused(false)}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          placeholderTextColor={AppTheme.colors.textFaint}
          secureTextEntry={!visible}
          style={[styles.input, ltr && styles.ltr, multiline && minHeight != null && { minHeight }, inputStyle]}
          textAlign={ltr ? 'left' : 'right'}
          value={value}
        />
        {secure ? (
          <IconButton
            accessibilityLabel={visible ? 'پنهان‌کردن رمز عبور' : 'نمایش رمز عبور'}
            disabled={!editable}
            icon={visible ? 'eye-off' : 'eye'}
            onPress={() => setVisible(current => !current)}
            size={40}
            tone="plain"
          />
        ) : null}
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <Icon color={AppTheme.status.danger.text} name="alert-circle" size={14} />
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: AppTheme.colors.textBody,
    fontFamily: Estedad.semiBold,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 7,
    textAlign: 'right',
  },
  field: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: 8,
    minHeight: 54,
    paddingHorizontal: 14,
  },
  disabled: {
    opacity: 0.55,
  },
  input: {
    color: AppTheme.colors.textStrong,
    flex: 1,
    fontFamily: Estedad.regular,
    fontSize: 15,
    lineHeight: 24,
    paddingVertical: 12,
  },
  ltr: {
    textAlign: 'left',
  },
  errorRow: {
    alignItems: 'flex-start',
    flexDirection: 'row-reverse',
    gap: 5,
    marginTop: 6,
  },
  error: {
    color: AppTheme.status.danger.text,
    flexShrink: 1,
    fontFamily: Estedad.regular,
    fontSize: 12.5,
    lineHeight: 19,
    textAlign: 'right',
  },
  hint: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 6,
    textAlign: 'right',
  },
});
