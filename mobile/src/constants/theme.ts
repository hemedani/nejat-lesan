/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'Estedad',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'Estedad',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'Estedad',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Estedad = {
  regular: 'Estedad',
  medium: 'Estedad-Medium',
  semiBold: 'Estedad-SemiBold',
  bold: 'Estedad-Bold',
  extraBold: 'Estedad-ExtraBold',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const AppTheme = {
  colors: {
    primary: '#087f8c',
    primaryStrong: '#066671',
    primarySoft: '#e5f3f4',
    primaryBorder: '#b8dee2',
    onPrimary: '#ffffff',
    onPrimaryMuted: '#d8f1f3',
    background: '#f4f7f9',
    surface: '#ffffff',
    surfaceMuted: '#f0f3f6',
    surfaceSunken: '#eaeff2',
    textStrong: '#123248',
    textBody: '#294858',
    textSecondary: '#607482',
    textFaint: '#90a4ae',
    border: '#e3eaee',
    borderStrong: '#d6e0e5',
    hairline: '#eef3f5',
    overlayScrim: 'rgba(0, 0, 0, 0.55)',
  },
  status: {
    success: { bg: '#e5f5ef', border: '#c2e5d4', text: '#217a5b' },
    warning: { bg: '#fff8ec', border: '#f0d9a8', text: '#b45309', deep: '#7c5b12' },
    danger: { bg: '#fff0f0', border: '#f5cccc', text: '#b33a3a' },
    info: { bg: '#e8f1fa', border: '#c5dcf1', text: '#2569a8' },
    neutral: { bg: '#eef3f5', border: '#e3eaee', text: '#607482' },
  },
} as const;

export type StatusTone = keyof typeof AppTheme.status;
export type AppColor = keyof typeof AppTheme.colors;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const Shadow = {
  card: {
    shadowColor: '#123248',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  floating: {
    shadowColor: '#123248',
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;

export const Motion = {
  fast: 120,
  base: 200,
  slow: 300,
} as const;

export const Type = {
  display: { fontSize: 28, lineHeight: 38, fontWeight: '800' },
  heading: { fontSize: 20, lineHeight: 30, fontWeight: '700' },
  subheading: { fontSize: 17, lineHeight: 26, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 24, fontWeight: '500' },
  bodyStrong: { fontSize: 15, lineHeight: 24, fontWeight: '700' },
  caption: { fontSize: 13, lineHeight: 19, fontWeight: '400' },
  micro: { fontSize: 11, lineHeight: 16, fontWeight: '500' },
} as const;
