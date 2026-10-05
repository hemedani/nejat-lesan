/**
 * A `date`, `time` or `datetime` field, presented in the Jalali calendar.
 *
 * The definition says only *that* a value is temporal — the engine never
 * validates the format — so the shape is this app's own contract
 * (`@/domain/form-datetime`) and the picker is the only thing that should
 * produce it. Rendering these types as a plain text box, which is what used to
 * happen, asked an officer at the roadside to hand-type `2026-10-01T12:30` from
 * memory and silently accepted a typo as "some string".
 *
 * Two separate concerns meet here, and they must not be confused:
 *
 *   - **What is stored** is Gregorian ISO (`2026-10-01`, `12:30`,
 *     `2026-10-01T12:30`). The backend accepts it through `date()` and the web
 *     panel and reports render it unchanged, so it is not ours to change.
 *   - **What the officer reads and taps** is Jalali, in Persian digits, from
 *     `@/domain/jalali`.
 *
 * The Jalali picker is built in JavaScript rather than handed to a native
 * control. `@expo/ui`'s `DateTimePicker` can be *told* a locale on iOS, but its
 * Android implementation ignores the prop entirely, so the same field would show
 * a Persian calendar on one platform and a Gregorian one on the other. Owning
 * the calendar keeps both platforms identical, and — because it is pure JS — it
 * needs no native module and no development build.
 *
 * The web build keeps a text input: that is the control the web form builder
 * preview already renders for these types, and changing it is a separate job.
 */

import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { AnswerValue } from '@forms';

import {
  datetimeFormatHint,
  parseStoredValue,
  toStoredValue,
  type DateTimeFieldType,
} from '@/domain/form-datetime';
import {
  formatJalaliClock,
  formatJalaliDate,
  formatJalaliDateTime,
} from '@/domain/jalali';
import { AppTheme, Estedad, Radius } from '@/constants/theme';

import { FormInput } from '../form-fields';
import { Icon } from '../ui/icon';
import { JalaliCalendar } from './jalali-calendar';
import { JalaliTimeColumns } from './jalali-time-columns';

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

/** The Jalali text an officer reads for a value. */
const formatDisplay = (type: DateTimeFieldType, date: Date): string => {
  if (type === 'date') return formatJalaliDate(date);
  if (type === 'time') return formatJalaliClock(date);
  return formatJalaliDateTime(date);
};

/** Label for the "jump to now" action, which differs by what is being set. */
const NOW_LABEL_FOR: Record<DateTimeFieldType, string> = {
  date: 'امروز',
  time: 'اکنون',
  datetime: 'اکنون',
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
  /**
   * The moment being edited inside the sheet, or `null` when it is closed.
   *
   * Edits are held here and only written on «تأیید»: paging through months or
   * scrolling past an hour must not commit a value the officer did not choose.
   */
  const [draft, setDraft] = useState<Date | null>(null);
  /** Which half of a `datetime` the sheet is showing. */
  const [tab, setTab] = useState<'date' | 'time'>('date');

  const parsed = parseStoredValue(type, value);
  const display = parsed ? formatDisplay(type, parsed) : '';

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

  const open = () => {
    setTab(type === 'time' ? 'time' : 'date');
    // Start from the stored value, or from now when the field is unanswered.
    setDraft(parseStoredValue(type, value) ?? new Date());
  };

  const close = () => setDraft(null);

  const confirm = () => {
    if (draft) onCommit(toStoredValue(type, draft));
    setDraft(null);
  };

  const clear = () => {
    onCommit(undefined);
    setDraft(null);
  };

  const showCalendar = draft !== null && type !== 'time' && (type === 'date' || tab === 'date');
  const showTime = draft !== null && type !== 'date' && (type === 'time' || tab === 'time');

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityLabel={display || LABEL_FOR[type]}
        accessibilityRole="button"
        accessibilityState={{ expanded: draft !== null }}
        onPress={open}
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

      <Modal
        animationType="fade"
        onRequestClose={close}
        transparent
        visible={draft !== null}
      >
        {/* Tapping the scrim dismisses; the sheet swallows its own taps. */}
        <Pressable onPress={close} style={styles.backdrop}>
          <Pressable onPress={() => undefined} style={styles.sheet}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>{LABEL_FOR[type]}</Text>
              {draft ? <Text style={styles.summary}>{formatDisplay(type, draft)}</Text> : null}
            </View>

            {type === 'datetime' ? (
              <View style={styles.tabs}>
                {(['date', 'time'] as const).map((candidate) => {
                  const active = tab === candidate;
                  return (
                    <Pressable
                      accessibilityRole="tab"
                      accessibilityState={{ selected: active }}
                      key={candidate}
                      onPress={() => setTab(candidate)}
                      style={[styles.tab, active && styles.tabActive]}
                    >
                      <Text style={[styles.tabText, active && styles.tabTextActive]}>
                        {candidate === 'date' ? 'تاریخ' : 'ساعت'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {showCalendar && draft ? (
              <JalaliCalendar onChange={setDraft} value={draft} />
            ) : null}
            {showTime && draft ? (
              <JalaliTimeColumns onChange={setDraft} value={draft} />
            ) : null}

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={clear}
                style={({ pressed }) => [pressed && styles.pressed]}
              >
                <Text style={styles.actionMuted}>پاک کردن</Text>
              </Pressable>

              <View style={styles.actionsTrailing}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setDraft(new Date())}
                  style={({ pressed }) => [styles.actionGhost, pressed && styles.pressed]}
                >
                  <Text style={styles.actionGhostText}>{NOW_LABEL_FOR[type]}</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={confirm}
                  style={({ pressed }) => [styles.actionPrimary, pressed && styles.pressed]}
                >
                  <Text style={styles.actionPrimaryText}>تأیید</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  actionsTrailing: { flexDirection: 'row-reverse', gap: 8 },
  actionGhost: {
    borderColor: AppTheme.colors.borderStrong,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  actionGhostText: {
    color: AppTheme.colors.textBody,
    fontFamily: Estedad.medium,
    fontSize: 13,
    lineHeight: 20,
  },
  actionMuted: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.medium,
    fontSize: 13,
    lineHeight: 20,
  },
  actionPrimary: {
    backgroundColor: AppTheme.colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  actionPrimaryText: {
    color: AppTheme.colors.onPrimary,
    fontFamily: Estedad.semiBold,
    fontSize: 13,
    lineHeight: 20,
  },
  backdrop: {
    backgroundColor: AppTheme.colors.overlayScrim,
    flex: 1,
    justifyContent: 'flex-end',
  },
  clear: { alignSelf: 'flex-start' },
  clearText: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.medium,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'right',
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
  // Persian digits with slashes are a single left-to-right run, so the text is
  // laid out LTR and aligned to the right where the officer reads from.
  value: {
    color: AppTheme.colors.textStrong,
    flex: 1,
    fontFamily: Estedad.regular,
    fontSize: 15,
    textAlign: 'right',
    writingDirection: 'ltr',
  },
  placeholder: {
    color: AppTheme.colors.textFaint,
    flex: 1,
    fontFamily: Estedad.regular,
    fontSize: 15,
    textAlign: 'right',
  },
  pressed: { opacity: 0.82 },
  sheet: {
    backgroundColor: AppTheme.colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    gap: 12,
    paddingBottom: 28,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sheetHead: { alignItems: 'center', gap: 2 },
  sheetTitle: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  summary: {
    color: AppTheme.colors.textStrong,
    fontFamily: Estedad.semiBold,
    fontSize: 17,
    lineHeight: 26,
    writingDirection: 'ltr',
  },
  tab: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    flex: 1,
    paddingVertical: 8,
  },
  tabActive: { backgroundColor: AppTheme.colors.surface },
  tabText: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.medium,
    fontSize: 13,
    lineHeight: 20,
  },
  tabTextActive: { color: AppTheme.colors.primaryStrong, fontFamily: Estedad.semiBold },
  tabs: {
    backgroundColor: AppTheme.colors.surfaceMuted,
    borderRadius: Radius.pill,
    flexDirection: 'row-reverse',
    padding: 3,
  },
  wrap: { gap: 8 },
});
