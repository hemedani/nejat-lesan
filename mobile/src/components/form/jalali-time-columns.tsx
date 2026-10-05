/**
 * Hour and minute columns for a `time` (or the time half of a `datetime`) field.
 *
 * Two scrollable columns rather than a wheel: it is the shape Persian apps use,
 * it needs no native module, and — unlike a wheel — a value can be reached by
 * scrolling directly to it instead of spinning past it. Hours sit on the right
 * and minutes to their left, matching the right-to-left reading order.
 *
 * As with the calendar, nothing about the date is decided here; the columns only
 * report the hour or minute the officer picked.
 */

import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { toPersianDigits } from '@/domain/jalali';
import { AppTheme, Estedad, Radius } from '@/constants/theme';

const ROW_HEIGHT = 40;
/** How many rows of context to leave above the selected value on open. */
const LEAD_ROWS = 2;

const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);

export function JalaliTimeColumns({
  value,
  onChange,
}: {
  /** The selected moment. Only its hour and minute are read. */
  value: Date;
  /** Called with the hour or minute changed; the rest of the moment is kept. */
  onChange: (next: Date) => void;
}) {
  const hour = value.getHours();
  const minute = value.getMinutes();

  const setHour = (next: number) =>
    onChange(new Date(value.getFullYear(), value.getMonth(), value.getDate(), next, minute));
  const setMinute = (next: number) =>
    onChange(new Date(value.getFullYear(), value.getMonth(), value.getDate(), hour, next));

  return (
    <View style={styles.wrap}>
      <Column
        label="ساعت"
        onSelect={setHour}
        selected={hour}
        values={HOURS}
      />
      <Column
        label="دقیقه"
        onSelect={setMinute}
        selected={minute}
        values={MINUTES}
      />
    </View>
  );
}

function Column({
  label,
  values,
  selected,
  onSelect,
}: {
  label: string;
  values: number[];
  selected: number;
  onSelect: (value: number) => void;
}) {
  // A stable layout lets `initialScrollIndex` land exactly, which is what puts
  // the current value in view the moment the sheet opens.
  const layout = useMemo(
    () => (_data: ArrayLike<number> | null | undefined, index: number) => ({
      index,
      length: ROW_HEIGHT,
      offset: ROW_HEIGHT * index,
    }),
    [],
  );

  return (
    <View style={styles.column}>
      <Text style={styles.columnLabel}>{label}</Text>
      <FlatList
        data={values}
        getItemLayout={layout}
        initialScrollIndex={Math.max(0, values.indexOf(selected) - LEAD_ROWS)}
        keyExtractor={(item) => String(item)}
        renderItem={({ item }) => {
          const isSelected = item === selected;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelect(item)}
              style={({ pressed }) => [
                styles.row,
                isSelected && styles.rowSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.rowText, isSelected && styles.rowTextSelected]}>
                {toPersianDigits(String(item).padStart(2, '0'))}
              </Text>
            </Pressable>
          );
        }}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row-reverse', gap: 10 },
  column: { flex: 1, gap: 6 },
  columnLabel: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.medium,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  list: {
    backgroundColor: AppTheme.colors.background,
    borderRadius: Radius.md,
    height: ROW_HEIGHT * 4,
  },
  row: {
    alignItems: 'center',
    height: ROW_HEIGHT,
    justifyContent: 'center',
  },
  rowSelected: { backgroundColor: AppTheme.colors.primarySoft },
  rowText: {
    color: AppTheme.colors.textBody,
    fontFamily: Estedad.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  rowTextSelected: { color: AppTheme.colors.primaryStrong, fontFamily: Estedad.semiBold },
  pressed: { opacity: 0.7 },
});
