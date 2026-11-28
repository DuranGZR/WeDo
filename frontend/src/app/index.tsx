import { Redirect } from 'expo-router';

import { BrandedLaunchScreen } from '@/components/ui/BrandedLaunchScreen';
import { useAuthStore } from '@/store/auth-store';

export default function IndexRoute() {
  const { hydrated, user } = useAuthStore();
  if (!hydrated) return <BrandedLaunchScreen />;
  return <Redirect href={user ? '/(tabs)' : '/(auth)/welcome'} />;
}
