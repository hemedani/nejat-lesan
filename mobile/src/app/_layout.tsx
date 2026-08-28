import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ToastProvider } from '@/components/ui/toast';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const [fontsLoaded] = useFonts({
    Estedad: require('@/assets/fonts/Estedad-Regular.ttf'),
    'Estedad-Medium': require('@/assets/fonts/Estedad-Medium.ttf'),
    'Estedad-SemiBold': require('@/assets/fonts/Estedad-SemiBold.ttf'),
    'Estedad-Bold': require('@/assets/fonts/Estedad-Bold.ttf'),
    'Estedad-ExtraBold': require('@/assets/fonts/Estedad-ExtraBold.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <ToastProvider>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }} />
      </ToastProvider>
    </ThemeProvider>
  );
}
