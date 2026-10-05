/**
 * A Jalali month grid.
 *
 * Presentation only: every conversion, month length and weekday offset comes
 * from `@/domain/jalali`, which is unit-tested against the official calendar.
 * This component decides nothing about dates — it renders the cells the domain
 * hands it and reports the day the officer taps.
 *
 * The layout is right-to-left throughout, because the Persian week runs
 * Saturday → Friday: the Saturday column sits on the right and the days of each
 * week fill in from the right. `row-reverse` with wrapping is what makes the
 * grid flow that way, and the weekday header uses the same direction so the
 * labels stay above their own column.
 */

import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  addJalaliMonths,
  buildJalaliMonthWeeks,
  formatJalaliMonthTitle,
  jalaliDayKey,
  toGregorianDate,
  toJalali,
  toPersianDigits,
  JALALI_WEEKDAY_INITIALS,
} from '@/domain/jalali';
import { AppTheme, Estedad, Radius } from '@/constants/theme';

import { Icon } from '../ui/icon';

export function JalaliCalendar({
  value,
  onChange,
}: {
  /** The selected day. Only its date part is read; the time is preserved. */
  value: Date;
  /** Called with the tapped day, keeping the time of day `value` carries. */
  onChange: (next: Date) => void;
}) {
  const selected = toJalali(value);
  // The visible month starts on the selection. The sheet unmounts when it
  // closes, so this re-seeds on every open and never fights the officer's paging.
  const [view, setView] = useState(() => ({ year: selected.year, month: selected.month }));

  const todayKey = useMemo(() => jalaliDayKey(new Date()), []);
  const weeks = useMemo(() => buildJalaliMonthWeeks(view.year, view.month), [view]);
  const selectedKey = jalaliDayKey(value);

  const pick = (day: number) => {
    const target = toGregorianDate({ year: view.year, month: view.month, day });
    // Carry the existing time of day across, so choosing a date on a `datetime`
    // field does not silently reset the clock the officer already set.
    onChange(
      new Date(
        target.getFullYear(),
        target.getMonth(),
        target.getDate(),
        value.getHours(),
        value.getMinutes(),
      ),
    );
  };

  const step = (delta: number) =>
    setView((current) => {
      const next = addJalaliMonths({ ...current, day: 1 }, delta);
      return { year: next.year, month: next.month };
    });

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        {/* In a right-to-left layout "back" is to the right, so the chevrons are
            named for the direction they point, not the month they reach. */}
        <Pressable
          accessibilityLabel="ماه قبل"
          accessibilityRole="button"
          onPress={() => step(-1)}
          style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
        >
          <Icon color={AppTheme.colors.textBody} name="chevron-forward" size={18} />
        </Pressable>

        <Text accessibilityRole="header" style={styles.title}>
          {formatJalaliMonthTitle(view.year, view.month)}
        </Text>

        <Pressable
          accessibilityLabel="ماه بعد"
          accessibilityRole="button"
          onPress={() => step(1)}
          style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
        >
          <Icon color={AppTheme.colors.textBody} name="chevron-back" size={18} />
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {JALALI_WEEKDAY_INITIALS.map((initial) => (
          <View key={initial} style={styles.weekdayCell}>
            <Text style={styles.weekdayLabel}>{initial}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {weeks.map((week, weekIndex) => (
          // One explicit row per week, laid out right-to-left, so the columns
          // line up under the weekday header above.
          <View key={`week-${weekIndex}`} style={styles.week}>
            {week.map((day, dayIndex) => {
              if (day === null) {
                return <View key={`blank-${weekIndex}-${dayIndex}`} style={styles.cell} />;
              }
              const key = `${view.year}-${view.month}-${day}`;
              const isSelected = key === selectedKey;
              const isToday = key === todayKey;
              // The Persian weekend is Friday, the last column of a week.
              const isHoliday = dayIndex === 6;

              return (
                <Pressable
                  accessibilityLabel={toPersianDigits(day)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  key={key}
                  onPress={() => pick(day)}
                  style={styles.cell}
                >
                  <View
                    style={[
                      styles.cellInner,
                      isToday && !isSelected && styles.cellToday,
                      isSelected && styles.cellSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.cellText,
                        isHoliday && !isSelected && styles.cellTextHoliday,
                        isSelected && styles.cellTextSelected,
                      ]}
                    >
                      {toPersianDigits(day)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  header: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  navButton: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  title: {
    color: AppTheme.colors.textStrong,
    fontFamily: Estedad.semiBold,
    fontSize: 15,
    lineHeight: 22,
  },
  weekdayRow: { flexDirection: 'row-reverse' },
  // `flex: 1` rather than a percentage: seven equal shares of an explicit row
  // divide evenly, with no rounding left over to spill into a second line.
  weekdayCell: { alignItems: 'center', flex: 1 },
  weekdayLabel: {
    color: AppTheme.colors.textFaint,
    fontFamily: Estedad.medium,
    fontSize: 12,
    lineHeight: 20,
  },
  grid: { gap: 2 },
  week: { flexDirection: 'row-reverse' },
  cell: { alignItems: 'center', height: 40, justifyContent: 'center', flex: 1 },
  cellInner: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  cellToday: { borderColor: AppTheme.colors.primaryBorder, borderWidth: 1 },
  cellSelected: { backgroundColor: AppTheme.colors.primary },
  cellText: {
    color: AppTheme.colors.textBody,
    fontFamily: Estedad.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  cellTextHoliday: { color: AppTheme.status.danger.text },
  cellTextSelected: { color: AppTheme.colors.onPrimary, fontFamily: Estedad.semiBold },
  pressed: { opacity: 0.7 },
});
