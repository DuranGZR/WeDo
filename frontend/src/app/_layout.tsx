import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'react-native';
import { AppProviders } from '@/providers/app-providers';
import { AppErrorBoundary } from '@/components/feedback/AppErrorBoundary';
import { RouteGuard } from '@/components/navigation';
import { ShareIntentProvider } from 'expo-share-intent';
import { ShareIntentNavigator } from '@/features/sharing/ShareIntentNavigator';

void SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return (
    <ShareIntentProvider>
      <AppErrorBoundary>
        <AppProviders>
          <StatusBar barStyle="dark-content" backgroundColor="#F7F6F2" />
          <ShareIntentNavigator />
          <RouteGuard />
        </AppProviders>
      </AppErrorBoundary>
    </ShareIntentProvider>
  );
}
