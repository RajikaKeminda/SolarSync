import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuthStore } from '../store';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuthStore();
  
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Force navigation to login if not authenticated
  useEffect(() => {
    if (loaded && !isLoading) {
      if (!isAuthenticated) {
        console.log('🔄 Redirecting to login - not authenticated');
        router.replace('/auth/login');
      } else if (user?.userType === 'ev_owner') {
        console.log('🔄 Redirecting to tabs - EV owner');
        router.replace('/(tabs)');
      } else if (user?.userType === 'station_owner') {
        console.log('🔄 Redirecting to business - Station owner');
        router.replace('/business');
      }
    }
  }, [loaded, isLoading, isAuthenticated, user?.userType, router]);

  // Show loading while fonts are loading or auth is initializing
  if (!loaded || isLoading) {
    return null;
  }

  console.log('🔍 Auth Debug:', { user, isAuthenticated, userType: user?.userType });

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack 
        screenOptions={{ headerShown: false }}
        initialRouteName={!isAuthenticated ? "auth/login" : undefined}
      >
        {!isAuthenticated ? (
          // Authentication screens
          <>
            <Stack.Screen 
              name="auth/login" 
              options={{
                headerShown: false,
                gestureEnabled: false, // Prevent swipe back
              }} 
            />
            <Stack.Screen name="auth/register" />
            <Stack.Screen name="auth/forgot-password" />
          </>
        ) : user?.userType === 'ev_owner' ? (
          // EV Owner screens
          <>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="vehicle/add" options={{ presentation: 'modal' }} />
            <Stack.Screen name="vehicle/edit" options={{ presentation: 'modal' }} />
            <Stack.Screen name="station/details" />
            <Stack.Screen name="station/book" options={{ presentation: 'modal' }} />
            <Stack.Screen name="charging/session" />
            <Stack.Screen name="trip/plan" />
            <Stack.Screen name="profile/edit" options={{ presentation: 'modal' }} />
            <Stack.Screen name="profile/settings" />
            <Stack.Screen name="notifications" />
          </>
        ) : (
          // Station Owner screens
          <>
            <Stack.Screen name="business" />
            <Stack.Screen name="business/station/add" options={{ presentation: 'modal' }} />
            <Stack.Screen name="business/station/edit" options={{ presentation: 'modal' }} />
            <Stack.Screen name="business/station/details" />
            <Stack.Screen name="business/settings" />
            <Stack.Screen name="business/profile/edit" options={{ presentation: 'modal' }} />
            <Stack.Screen name="notifications" />
          </>
        )}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
