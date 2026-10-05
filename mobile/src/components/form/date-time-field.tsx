/**
 * A `date`, `time` or `datetime` field.
 *
 * The definition says only *that* a value is temporal — the engine never
 * validates the format — so the shape is this app's own contract
 * (`@/domain/form-datetime`) and the picker is the only thing that should
 * produce it. Rendering these types as a plain text box, which is what used to
 * happen, asked an officer at the roadside to hand-type `2026-10-01T12:30` from
 * memory and silently accepted a typo as "some string".
 *
 * The picker is `@expo/ui`'s drop-in `DateTimePicker`: it wraps the native
 * SwiftUI `DatePicker` on iOS and the Jetpack Compose dialogs on Android. It is
 * already a dependency and ships inside Expo Go for SDK 57, so this adds no
 * native module and no development-build requirement.
 *
 * Two platform facts drive the structure below:
 *
 *   - Android's picker has **no** combined date + time mode (`mode: 'datetime'`
 *     degrades to date only), so a `datetime` field is collected in two dialogs
 *     and the chosen day is held aside between them.
 *   - The web build of the picker renders `null`, so the web target keeps a text
 *     input — exactly the control the app used for these fields before.
 */

import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { DateTimePicker } from '@expo/ui/community/datetime-picker';

import type { AnswerValue } from '@forms';

import {
  datetimeFormatHint,
  formatStoredValue,
  parseStoredValue,
  toStoredValue,
  type DateTimeFieldType,
} from '@/domain/form-datetime';
import { AppTheme, Estedad, Radius } from '@/constants/theme';

import { FormInput } from '../form-fields';
import { Icon } from '../ui/icon';

/** Which glyph an officer associates with the value they are choosing. */
const ICON_FOR: Record<DateTimeFieldType, 'calendar-outline' | 'time-outline'> = {
  date: 'calendar-outline',
  time: 'time-outline',
  datetime: 'calendar-outline',
};

const LABEL_FOR: Record<DateTimeFieldType, string> = {
  date: 'انتخاب تاریخ',
  time: 'انتخاب ساعت',
  datetime: 'انتخاب تاریخ و ساعت',
};

export function DateTimeField({
  type,
  value,
  onCommit,
  hasError,
}: {
  type: DateTimeFieldType;
  value: AnswerValue | undefined;
  /** `undefined` clears the answer, matching "not answered" for the engine. */
  onCommit: (next: string | undefined) => void;
  hasError?: boolean;
}) {
  const [open, setOpen] = useState(false);
  /** Only Android uses a stage: the day first, then the clock. */
  const [stage, setStage] = useState<'date' | 'time'>('date');
  /** The day chosen in the first Android dialog, while the time is being picked. */
  const [pendingDay, setPendingDay] = useState<Date | null>(null);

  const display = formatStoredValue(type, value);
  // `new Date()` is only a starting position; nothing is committed until the
  // officer actually changes the value.
  const anchor = useMemo(
    () => parseStoredValue(type, value) ?? new Date(),
    [type, value],
  );

  if (Platform.OS === 'web') {
    return (
      <FormInput
        hasError={hasError}
        onChangeText={(text) => onCommit(text)}
        placeholder={datetimeFormatHint(type)}
        value={typeof value === 'string' ? value : ''}
      />
    );
  }

  const androidTwoStage = type === 'datetime' && Platform.OS === 'android';
  // `datetime` is a real mode on iOS; on Android it has to be two passes.
  const mode: DateTimeFieldType = androidTwoStage ? stage : type;

  const close = () => {
    setOpen(false);
    setStage('date');
    setPendingDay(null);
  };

  const toggle = () => {
    if (open) close();
    else setOpen(true);
  };

  const handleChange = (_event: unknown, date: Date) => {
    if (androidTwoStage && stage === 'date') {
      // Remember the day and reopen as a clock dialog; committing here would
      // throw away the time the officer is about to choose.
      setPendingDay(date);
      setStage('time');
      return;
    }

    if (androidTwoStage) {
      const day = pendingDay ?? new Date();
      const combined = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
        date.getHours(),
        date.getMinutes(),
      );
      onCommit(toStoredValue('datetime', combined));
      close();
      return;
    }

    onCommit(toStoredValue(type, date));
    // iOS keeps the picker inline so the officer can keep adjusting; Android's
    // dialog is a one-shot modal that must be unmounted once it has answered.
    if (Platform.OS === 'android') close();
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityLabel={display || LABEL_FOR[type]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={toggle}
        style={({ pressed }) => [
          styles.control,
          hasError && styles.controlError,
          pressed && styles.pressed,
        ]}
      >
        <Icon color={AppTheme.colors.textSecondary} name={ICON_FOR[type]} size={16} />
        <Text style={display ? styles.value : styles.placeholder}>
          {display || 'انتخاب کنید'}
        </Text>
      </Pressable>

      {display ? (
        <Pressable
          accessibilityLabel={`پاک کردن ${LABEL_FOR[type]}`}
          accessibilityRole="button"
          onPress={() => onCommit(undefined)}
          style={({ pressed }) => [styles.clear, pressed && styles.pressed]}
        >
          <Text style={styles.clearText}>پاک کردن</Text>
        </Pressable>
      ) : null}

      {open ? (
        <View style={styles.pickerHost}>
          <DateTimePicker
            accentColor={AppTheme.colors.primary}
            display="default"
            is24Hour
            // Android presents its picker as a dialog that opens **on mount**, so
            // moving from the day stage to the clock stage has to remount it —
            // changing `mode` alone would update the props of a dialog that has
            // already been dismissed and nothing would appear.
            key={mode}
            mode={mode}
            onDismiss={close}
            onValueChange={handleChange}
            presentation="dialog"
            value={anchor}
          />
          {Platform.OS === 'ios' ? (
            // iOS has no dialog presentation — the picker is inline and there is
            // nothing to dismiss, so the officer needs a way to fold it away.
            <Pressable
              accessibilityRole="button"
              onPress={close}
              style={({ pressed }) => [styles.confirm, pressed && styles.pressed]}
            >
              <Text style={styles.confirmText}>تأیید</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  clear: { alignSelf: 'flex-start' },
  clearText: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.medium,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'right',
  },
  confirm: {
    alignSelf: 'flex-start',
    backgroundColor: AppTheme.colors.primarySoft,
    borderColor: AppTheme.colors.primaryBorder,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  confirmText: {
    color: AppTheme.colors.primaryStrong,
    fontFamily: Estedad.medium,
    fontSize: 13,
    lineHeight: 20,
  },
  control: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.surface,
    borderColor: AppTheme.colors.borderStrong,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: 8,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  controlError: {
    backgroundColor: AppTheme.status.danger.bg,
    borderColor: AppTheme.status.danger.border,
  },
  // The stored value is Latin and read left-to-right, so it is not mirrored.
  value: {
    color: AppTheme.colors.textStrong,
    flex: 1,
    fontFamily: Estedad.regular,
    fontSize: 15,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  placeholder: {
    color: AppTheme.colors.textFaint,
    flex: 1,
    fontFamily: Estedad.regular,
    fontSize: 15,
    textAlign: 'right',
  },
  pickerHost: { gap: 8 },
  pressed: { opacity: 0.82 },
  wrap: { gap: 8 },
});
