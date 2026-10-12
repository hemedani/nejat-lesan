import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Bottom padding for a surface pinned to the bottom of the window.
 *
 * Android draws its navigation bar — or, with gesture navigation, its pill —
 * over the app, so anything sitting flush against the bottom of a screen is
 * partly unreachable there while looking fine on iOS. A hardcoded padding cannot
 * be right on both, and it cannot be right on Android either, because the bar is
 * ~24dp on three-button navigation and ~48dp with a gesture pill.
 *
 * Use this for bottom-anchored surfaces: a bottom sheet, a pinned CTA bar, a
 * modal's action row. Whole-screen `SafeAreaView` edges already cover the case
 * where the screen itself, not one element inside it, is what must clear the
 * bar.
 *
 * @param min floor for the result, so a device reporting no inset (or a
 * platform that draws nothing there) still gets breathing room.
 */
export function useBottomInset(min = 0): number {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, min);
}
