import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'WeDo',
  slug: 'wedo',
  owner: 'durangzr',
  version: '0.1.0',
  icon: './assets/TekLogo.png',
  splash: {
    image: './assets/TekLogo.png',
    resizeMode: 'contain',
    backgroundColor: '#F7F6F2',
  },
  orientation: 'portrait',
  scheme: 'wedo',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  plugins: [
    'expo-router',
    'expo-font',
    'expo-secure-store',
    'expo-notifications',
    'expo-sqlite',
    [
      'expo-share-intent',
      {
        iosShareExtensionName: 'WeDo',
        iosActivationRules: {
          NSExtensionActivationSupportsText: true,
          NSExtensionActivationSupportsWebURLWithMaxCount: 1,
          NSExtensionActivationSupportsWebPageWithMaxCount: 1,
          NSExtensionActivationSupportsImageWithMaxCount: 1,
        },
        androidIntentFilters: ['text/*', 'image/*'],
        androidMultiIntentFilters: ['image/*'],
      },
    ],
  ],
  experiments: { typedRoutes: true },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.wedo.app',
  },
  android: {
    package: 'com.wedo.app',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/TekLogo.png',
      backgroundColor: '#F7F6F2',
    },
  },
  web: {
    favicon: './assets/TekLogo.png',
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000',
    eas: { projectId: process.env.EAS_PROJECT_ID ?? '4a68916f-7f20-44ff-ba03-22e50eaa4774' },
  },
};

export default config;
