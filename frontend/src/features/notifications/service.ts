import { t, currentLanguage } from '@/i18n';
import {
  AndroidImportance,
  PermissionStatus,
  getExpoPushTokenAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  setNotificationChannelAsync,
} from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { apiClient } from '@/api/client/api-client';

export async function registerForPushNotifications(accessToken: string) {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android') {
    await setNotificationChannelAsync('wedo-updates', {
      name: t('notifications.wedoUpdates'),
      importance: AndroidImportance.DEFAULT,
    });
  }
  const existing = await getPermissionsAsync();
  const permission =
    existing.status === PermissionStatus.GRANTED
      ? existing
      : await requestPermissionsAsync();
  if (permission.status !== PermissionStatus.GRANTED) return false;
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return false;
  let deviceId = await AsyncStorage.getItem('wedo.device-id');
  if (!deviceId) {
    deviceId = `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    await AsyncStorage.setItem('wedo.device-id', deviceId);
  }
  const token = await getExpoPushTokenAsync({ projectId });
  await apiClient('/api/v1/devices', {
    method: 'POST',
    accessToken,
    body: {
      device_id: deviceId,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      push_token: token.data,
      language: currentLanguage(),
    },
  });
  return true;
}
