import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
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
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
