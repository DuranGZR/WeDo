import { useEffect, useRef } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';

import { useAuthStore } from '@/store/auth-store';

/** Routes an incoming native share into WeDo's save flow after authentication. */
export function ShareIntentNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const user = useAuthStore((state) => state.user);
  const { hasShareIntent, shareIntent } = useShareIntentContext();
  const handledShareKey = useRef<string | undefined>(undefined);

  const shareKey = JSON.stringify({
    url: shareIntent.webUrl,
    text: shareIntent.text,
    files: shareIntent.files?.map((file) => file.path),
  });
  const isOnShareScreen = segments[0] === '(share)';

  useEffect(() => {
    if (!hasShareIntent) {
      handledShareKey.current = undefined;
      return;
    }
    if (!user || isOnShareScreen || handledShareKey.current === shareKey) return;

    handledShareKey.current = shareKey;
    router.replace('/(share)/compose');
  }, [hasShareIntent, isOnShareScreen, router, shareKey, user]);

  return null;
}
