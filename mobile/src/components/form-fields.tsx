import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppTheme, Estedad, Radius } from '@/constants/theme';
import type { IconFamily, IconName } from '@/constants/icon-map';
import type { RefStruct } from '@/domain/accident-form';

import { Icon } from './ui/icon';
import { IconButton } from './ui/icon-button';

export function FieldLabel({ text }: { text: string }) {
  return <Text style={styles.fieldLabel}>{text}</Text>;
}

export function ErrorText({ text }: { text: string }) {
  return (
    <View style={styles.errorRow}>
      <Icon color={AppTheme.status.danger.text} name="alert-circle" size={13} />
      <Text style={styles.errorText}>{text}</Text>
    </View>
  );
}

export function HintRow({ text }: { text: string }) {
  return <Text style={styles.hint}>{text}</Text>;
}

export type ChipItem = {
  key: string;
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: { name: IconName; family?: IconFamily };
};

export function ChipsRow({ items }: { items: ChipItem[] }) {
  return (
    <View style={styles.chipsWrap}>
      {items.map(item => (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: item.selected }}
          key={item.key}
          onPress={item.onPress}
          style={({ pressed }) => [
            styles.chip,
            item.selected && styles.chipSelected,
            pressed && styles.chipPressed,
          ]}
        >
          {item.icon ? (
            <Icon
              color={item.selected ? AppTheme.colors.primaryStrong : AppTheme.colors.textSecondary}
              family={item.icon.family}
              name={item.icon.name}
              size={16}
            />
          ) : null}
          <Text style={[styles.chipText, item.selected && styles.chipTextSelected]}>{item.label}</Text>
          {!item.icon && item.selected ? (
            <Icon color={AppTheme.colors.primaryStrong} name="checkmark" size={14} />
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

export function FormInput({
  value,
  onChangeText,
  placeholder,
  multiline,
  hasError,
  keyboardType,
  style,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  hasError?: boolean;
  keyboardType?: 'default' | 'number-pad';
  style?: object;
}) {
  const [focused, setFocused] = useState(false);
  const borderColor = hasError
    ? AppTheme.status.danger.border
    : focused
      ? AppTheme.colors.primaryBorder
      : AppTheme.colors.borderStrong;

  return (
    <TextInput
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={multiline ? 3 : undefined}
      onBlur={() => setFocused(false)}
      onChangeText={onChangeText}
      onFocus={() => setFocused(true)}
      placeholder={placeholder}
      placeholderTextColor={AppTheme.colors.textFaint}
      style={[
        styles.input,
        { borderColor },
        hasError && styles.inputErrorBg,
        multiline && styles.textarea,
        style,
      ]}
      textAlignVertical={multiline ? 'top' : 'center'}
      value={value}
    />
  );
}

function optionItems(
  options: { _id: string; name: string }[],
  isSelected: (option: { _id: string; name: string }) => boolean,
  onSelect: (option: { _id: string; name: string }) => void,
  iconFor?: (option: { _id: string; name: string }) => { name: IconName; family?: IconFamily } | undefined,
): ChipItem[] {
  return options.map(option => ({
    key: option._id,
    label: option.name,
    onPress: () => onSelect(option),
    selected: isSelected(option),
    icon: iconFor?.(option),
  }));
}

export function IdChips({
  options,
  value,
  onChange,
  iconFor,
}: {
  options: { _id: string; name: string }[];
  value?: string;
  onChange: (id: string) => void;
  iconFor?: (option: { _id: string; name: string }) => { name: IconName; family?: IconFamily } | undefined;
}) {
  return (
    <ChipsRow
      items={optionItems(
        options,
        option => option._id === value,
        option => onChange(option._id),
        iconFor,
      )}
    />
  );
}

export function StructChips({
  options,
  value,
  onChange,
}: {
  options: { _id: string; name: string }[];
  value?: RefStruct;
  onChange: (struct: RefStruct) => void;
}) {
  return (
    <ChipsRow
      items={optionItems(
        options,
        option => option._id === value?._id,
        option => onChange({ _id: option._id, name: option.name }),
      )}
    />
  );
}

export function BoolChips({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | undefined;
  onChange: (value: boolean) => void;
}) {
  const options: { v: boolean; label: string }[] = [
    { v: true, label: 'بله' },
    { v: false, label: 'خیر' },
  ];
  return (
    <View style={styles.boolRow}>
      <FieldLabel text={label} />
      <View style={styles.boolChips}>
        {options.map(option => {
          const selected = option.v === value;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={option.label}
              onPress={() => onChange(option.v)}
              style={({ pressed }) => [
                styles.smallChip,
                selected && styles.chipSelected,
                pressed && styles.chipPressed,
              ]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function CardShell({
  index,
  title,
  onRemove,
  children,
}: {
  index: number;
  title: string;
  onRemove?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          {title} {(index + 1).toLocaleString('fa-IR')}
        </Text>
        {onRemove ? (
          <IconButton
            accessibilityLabel={`حذف ${title} ${(index + 1).toLocaleString('fa-IR')}`}
            icon="trash"
            onPress={() =>
              Alert.alert(`حذف ${title}`, 'آیا از حذف این مورد مطمئن هستید؟ اطلاعات ذخیره‌شده این کارت پاک می‌شود.', [
                { style: 'cancel', text: 'انصراف' },
                { onPress: onRemove, style: 'destructive', text: 'حذف' },
              ])
            }
            size={40}
            tone="danger"
          />
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  boolChips: { flexDirection: 'row-reverse', gap: 8 },
  boolRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  card: {
    backgroundColor: AppTheme.colors.surface,
    borderColor: AppTheme.colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  cardHeader: {
    alignItems: 'center',
    borderBottomColor: AppTheme.colors.hairline,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  cardTitle: {
    color: AppTheme.colors.textStrong,
    fontFamily: Estedad.bold,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'right',
  },
  chip: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.surface,
    borderColor: AppTheme.colors.borderStrong,
    borderRadius: Radius.pill,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
  },
  chipPressed: { opacity: 0.82 },
  chipSelected: {
    backgroundColor: AppTheme.colors.primarySoft,
    borderColor: AppTheme.colors.primaryBorder,
  },
  chipText: {
    color: AppTheme.colors.textBody,
    fontFamily: Estedad.medium,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
  },
  chipTextSelected: { color: AppTheme.colors.primaryStrong },
  chipsWrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  errorRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 5,
  },
  errorText: {
    color: AppTheme.status.danger.text,
    flexShrink: 1,
    fontFamily: Estedad.regular,
    fontSize: 12.5,
    lineHeight: 19,
    textAlign: 'right',
  },
  fieldLabel: {
    color: AppTheme.colors.textBody,
    fontFamily: Estedad.semiBold,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    textAlign: 'right',
  },
  hint: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'right',
  },
  input: {
    backgroundColor: AppTheme.colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    color: AppTheme.colors.textStrong,
    fontFamily: Estedad.regular,
    fontSize: 15,
    minHeight: 50,
    paddingHorizontal: 14,
    textAlign: 'right',
  },
  inputErrorBg: {
    backgroundColor: AppTheme.status.danger.bg,
  },
  smallChip: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.surface,
    borderColor: AppTheme.colors.borderStrong,
    borderRadius: Radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 64,
    paddingHorizontal: 14,
  },
  textarea: { minHeight: 110, paddingTop: 12 },
});
