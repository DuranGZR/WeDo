import { Redirect, Slot, useSegments } from 'expo-router';

import { useAuthStore } from '@/store/auth-store';

export function RouteGuard() {
  const { hydrated, user } = useAuthStore();
  const segments = useSegments();
  if (!hydrated) return null;
  const group = segments[0];
  if (!user && group !== '(auth)' && group !== 'invite' && group !== '(share)')
    return <Redirect href="/(auth)/welcome" />;
  if (user && group === '(auth)') return <Redirect href="/(tabs)" />;
  return <Slot />;
}
