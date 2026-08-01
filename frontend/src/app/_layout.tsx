import { AppProviders } from '@/providers/app-providers';
import { AppErrorBoundary } from '@/components/feedback/AppErrorBoundary';
import { RouteGuard } from '@/components/navigation';
import { ShareIntentProvider } from 'expo-share-intent';
import { ShareIntentNavigator } from '@/features/sharing/ShareIntentNavigator';

export default function RootLayout() {
  return (
    <ShareIntentProvider>
      <AppErrorBoundary>
        <AppProviders>
          <ShareIntentNavigator />
          <RouteGuard />
        </AppProviders>
      </AppErrorBoundary>
    </ShareIntentProvider>
  );
}
