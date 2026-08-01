import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useAuthStore } from '@/store/auth-store';

export function RouteGuard() {
  const { hydrated, user } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const group = segments[0];

  useEffect(() => {
    if (!hydrated) return;
    if (!user && group !== '(auth)' && group !== 'invite' && group !== '(share)') {
      router.replace('/(auth)/welcome');
    }
    if (user && group === '(auth)') router.replace('/(tabs)');
  }, [group, hydrated, router, user]);

  if (!hydrated) return null;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === 'android' ? 'ios_from_right' : 'default',
        animationDuration: 220,
        animationTypeForReplace: 'push',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen
        name="(auth)"
        options={{ animation: 'fade', animationDuration: 180, gestureEnabled: false }}
      />
      <Stack.Screen
        name="(tabs)"
        options={{ animation: 'fade', animationDuration: 180, animationTypeForReplace: 'push' }}
      />
      <Stack.Screen name="(onboarding)" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen
        name="(share)"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="invite" options={{ animation: 'fade_from_bottom' }} />
    </Stack>
  );
}
