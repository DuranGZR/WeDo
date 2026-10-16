import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/api/query-client';
import { PropsWithChildren, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableFreeze } from 'react-native-screens';

import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/store/auth-store';
import { initializeDatabase } from '@/database/client';
import { NotificationEffects } from './notification-effects';
import { syncOutbox } from '@/features/sharing/sync';
import { ToastProvider } from '@/components/feedback/AppToast';
import { useLanguageStore } from '@/store/language-store';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/api/client/api-client';

enableFreeze(true);

export function AppProviders({ children }: PropsWithChildren) {
  useTranslation();
  const languageSync = useRef(Promise.resolve<unknown>(undefined));
  const language = useLanguageStore((state) => state.language);
  const languageHydrated = useLanguageStore((state) => state.hydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const hydrate = useAuthStore((state) => state.hydrate);
  const hydrated = useAuthStore((state) => state.hydrated);

  useEffect(() => {
    initializeDatabase();
    void useLanguageStore.getState().hydrate().then(hydrate);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void syncOutbox();
        void useLanguageStore.getState().refreshSystemLanguage();
      }
    });
    return () => subscription.remove();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated && languageHydrated) {
      void SplashScreen.hideAsync().catch(() => {});
    }
  }, [hydrated, languageHydrated]);
  useEffect(() => {
    if (!accessToken) return;
    void syncOutbox();
    const retry = setInterval(() => {
      if (AppState.currentState === 'active') void syncOutbox();
    }, 30_000);
    return () => clearInterval(retry);
  }, [accessToken]);
  useEffect(() => {
    if (!languageHydrated || !accessToken) return;
    const syncLanguage = () => {
      // Keep rapid preference updates in order; retry when the app is active.
      languageSync.current = languageSync.current
        .catch(() => {})
        .then(() =>
          apiClient('/api/v1/users/me', {
            method: 'PATCH',
            accessToken,
            body: { preferred_language: language },
          }),
        )
        .catch(() => {});
    };
    syncLanguage();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncLanguage();
    });
    void queryClient.invalidateQueries({
      predicate: (query) =>
        query.queryKey.some((part) => part === 'notifications' || part === 'activities'),
    });
    return () => subscription.remove();
  }, [accessToken, language, languageHydrated]);
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NotificationEffects />
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
