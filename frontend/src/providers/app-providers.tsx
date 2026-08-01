import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren, useEffect } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableFreeze } from 'react-native-screens';

import { useAuthStore } from '@/store/auth-store';
import { initializeDatabase } from '@/database/client';
import { NotificationEffects } from './notification-effects';
import { syncOutbox } from '@/features/sharing/sync';
import { ToastProvider } from '@/components/feedback/AppToast';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

enableFreeze(true);

export function AppProviders({ children }: PropsWithChildren) {
  const hydrate = useAuthStore((state) => state.hydrate);
  useEffect(() => {
    initializeDatabase();
    void hydrate();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncOutbox();
    });
    return () => subscription.remove();
  }, [hydrate]);
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NotificationEffects />
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
