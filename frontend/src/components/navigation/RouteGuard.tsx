import { Stack, useGlobalSearchParams, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { BrandedLaunchScreen } from '@/components/ui/BrandedLaunchScreen';
import { useAuthStore } from '@/store/auth-store';

const LAUNCH_INTRO_MS = 950;

export function RouteGuard() {
  const { hydrated, user } = useAuthStore();
  const segments = useSegments();
  const params = useGlobalSearchParams<{ inviteToken?: string }>();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [introDone, setIntroDone] = useState(
    () => process.env.NODE_ENV === 'test' || Boolean(reducedMotion),
  );
  const group = segments[0];

  useEffect(() => {
    if (introDone) return;
    const timer = setTimeout(() => setIntroDone(true), LAUNCH_INTRO_MS);
    return () => clearTimeout(timer);
  }, [introDone]);

  useEffect(() => {
    if (!hydrated || !introDone) return;
    const isPublicGroup =
      group === '(auth)' ||
      group === 'invite' ||
      group === '(share)' ||
      (group as string) === 'legal';
    if (!user && !isPublicGroup) {
      router.replace('/(auth)/welcome');
    }
    if (user && group === '(auth)') {
      router.replace(
        params.inviteToken ? (`/invite/${params.inviteToken}` as never) : '/(tabs)',
      );
    }
  }, [group, hydrated, introDone, params.inviteToken, router, user]);

  if (!hydrated || !introDone) return <BrandedLaunchScreen />;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === 'android' ? 'ios_from_right' : 'default',
        animationTypeForReplace: 'push',
        fullScreenGestureEnabled: true,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen
        name="(auth)"
        options={{ animation: 'fade', animationDuration: 180, gestureEnabled: false }}
      />
      <Stack.Screen
        name="(tabs)"
        options={{
          animation: 'fade',
          animationDuration: 180,
          animationTypeForReplace: 'push',
        }}
      />
      <Stack.Screen name="(onboarding)" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen
        name="(share)"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="item/create"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="search"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="list/[listId]/search"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="list/create"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="list/[listId]/edit"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="space/create"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="invite"
        options={{
          animation: Platform.OS === 'android' ? 'ios_from_right' : 'default',
        }}
      />
      <Stack.Screen
        name="legal"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </Stack>
  );
}
