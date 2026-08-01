import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { handleNotificationData } from '@/features/notifications/navigation';
import { registerForPushNotifications } from '@/features/notifications/service';
import { useAuthStore } from '@/store/auth-store';

export function NotificationEffects() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const pushEnabled = useAuthStore(
    (state) => state.user?.push_notifications_enabled ?? true,
  );
  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    const received = Notifications.addNotificationReceivedListener(() => undefined);
    const response = Notifications.addNotificationResponseReceivedListener((event) => {
      handleNotificationData(
        event.notification.request.content.data as Record<string, unknown>,
      );
    });
    return () => {
      received.remove();
      response.remove();
    };
  }, []);
  useEffect(() => {
    if (!accessToken || !pushEnabled) return;
    void registerForPushNotifications(accessToken).catch(() => undefined);
  }, [accessToken, pushEnabled]);
  return null;
}
