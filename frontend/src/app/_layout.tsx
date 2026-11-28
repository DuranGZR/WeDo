import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProviders } from '@/providers/app-providers';
import { AppErrorBoundary } from '@/components/feedback/AppErrorBoundary';
import { RouteGuard } from '@/components/navigation';
import { ShareIntentProvider } from 'expo-share-intent';
import { ShareIntentNavigator } from '@/features/sharing/ShareIntentNavigator';

void SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ShareIntentProvider>
        <AppErrorBoundary>
          <AppProviders>
            <StatusBar barStyle="dark-content" />
            <ShareIntentNavigator />
            <RouteGuard />
          </AppProviders>
        </AppErrorBoundary>
      </ShareIntentProvider>
    </GestureHandlerRootView>
  );
}
