import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'WeDo',
  slug: 'wedo',
  owner: 'durangzr',
  version: '1.0.0',
  icon: './assets/app-icon.png',
  orientation: 'portrait',
  scheme: 'wedo',
  userInterfaceStyle: 'light',
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/TekLogo.png',
        resizeMode: 'contain',
        backgroundColor: '#F7F6F2',
      },
    ],
    'expo-font',
    'expo-secure-store',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#2B2B28',
      },
    ],
    'expo-sqlite',
    'expo-apple-authentication',
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
    './plugins/withShareIntegration',
  ],
  experiments: { typedRoutes: true },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.wedo.app',
    buildNumber: '1',
    usesAppleSignIn: true,
    infoPlist: {
      NSPhotoLibraryUsageDescription:
        'WeDo, ortak listelerinize ve anılarınıza fotoğraf ekleyebilmeniz için fotoğraf galerinize erişim gerektirir.',
      NSPhotoLibraryAddUsageDescription:
        'WeDo, anılarınızı ve fotoğraflarınızı cihazınızın albümüne kaydedebilmeniz için galeriye kaydetme izni gerektirir.',
      NSCameraUsageDescription:
        'WeDo, fotoğraf çekip anı ve listelerinize ekleyebilmeniz için kamera erişimi gerektirir.',
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'com.wedo.app',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#F7F6F2',
      monochromeImage: './assets/notification-icon.png',
    },
    permissions: [
      'RECEIVE_BOOT_COMPLETED',
      'READ_MEDIA_IMAGES',
      'POST_NOTIFICATIONS',
    ],
  },
  web: {
    favicon: './assets/TekLogo.png',
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000',
    eas: { projectId: process.env.EAS_PROJECT_ID ?? '4a68916f-7f20-44ff-ba03-22e50eaa4774' },
    privacyPolicyUrl:
      process.env.EXPO_PUBLIC_PRIVACY_URL ??
      'https://wedo-production-3ad2.up.railway.app/legal#privacy',
    termsOfServiceUrl:
      process.env.EXPO_PUBLIC_TERMS_URL ??
      'https://wedo-production-3ad2.up.railway.app/legal#terms',
    accountDeletionUrl:
      process.env.EXPO_PUBLIC_DELETION_URL ??
      'https://wedo-production-3ad2.up.railway.app/legal#delete-account',
  },
};

export default config;
