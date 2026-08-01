import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'wedo.access-token';
const REFRESH_TOKEN_KEY = 'wedo.refresh-token';

function getWebItem(key: string) {
  return typeof window === 'undefined' ? null : window.localStorage.getItem(key);
}

function setWebItem(key: string, value: string) {
  if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
}

function deleteWebItem(key: string) {
  if (typeof window !== 'undefined') window.localStorage.removeItem(key);
}

export const secureStorage = {
  async getTokens() {
    if (Platform.OS === 'web') {
      return {
        accessToken: getWebItem(ACCESS_TOKEN_KEY),
        refreshToken: getWebItem(REFRESH_TOKEN_KEY),
      };
    }
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    ]);
    return { accessToken, refreshToken };
  },
  async setTokens(accessToken: string, refreshToken: string) {
    if (Platform.OS === 'web') {
      setWebItem(ACCESS_TOKEN_KEY, accessToken);
      setWebItem(REFRESH_TOKEN_KEY, refreshToken);
      return;
    }
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  },
  async clear() {
    if (Platform.OS === 'web') {
      deleteWebItem(ACCESS_TOKEN_KEY);
      deleteWebItem(REFRESH_TOKEN_KEY);
      return;
    }
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
  },
};
