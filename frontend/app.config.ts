import type { ExpoConfig } from 'expo/config';

const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const shareExtensionName = 'WeDoShare';
if (
  process.env.EAS_BUILD_PLATFORM === 'ios' &&
  (!googleIosClientId || !googleWebClientId)
) {
  throw new Error('Set Google iOS and Web client IDs in the EAS build environment.');
}
const googlePlugins: NonNullable<ExpoConfig['plugins']> = googleIosClientId
  ? [
      [
        '@react-native-google-signin/google-signin',
        { iosUrlScheme: googleIosClientId.split('.').reverse().join('.') },
      ],
    ]
  : [];

const config: ExpoConfig = {
  name: 'WeDo',
  slug: 'wedo',
  owner: 'durangzr',
  version: '1.0.0',
  icon: './assets/app-icon.png',
  orientation: 'portrait',
  scheme: 'wedo',
  userInterfaceStyle: 'light',
  locales: { tr: './locales/tr.json', en: './locales/en.json' },
  plugins: [
    'expo-router',
    ['expo-localization', { supportedLocales: ['tr', 'en'] }],
    [
      'expo-splash-screen',
      {
        image: './assets/TekLogo.png',
        resizeMode: 'contain',
        backgroundColor: '#F6F4F0',
      },
    ],
    'expo-font',
    'expo-secure-store',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#9E7F60',
      },
    ],
    'expo-sqlite',
    'expo-apple-authentication',
    'expo-image',
    [
      'expo-calendar',
      {
        calendarPermission:
          'WeDo adds your planned ideas to your calendar when you choose to save a date.',
      },
    ],
    '@react-native-community/datetimepicker',
    ...googlePlugins,
    [
      'expo-share-intent',
      {
        iosShareExtensionName: shareExtensionName,
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
    ['./plugins/withShareLocales', { extensionName: shareExtensionName }],
  ],
  experiments: { typedRoutes: true },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.durangezer.wedo',
    buildNumber: '14',
    usesAppleSignIn: true,
    infoPlist: {
      CFBundleDevelopmentRegion: 'en',
      ITSAppUsesNonExemptEncryption: false,
      NSCalendarsUsageDescription:
        'WeDo saves planned dates to your calendar when you choose to add a reminder.',
      NSCalendarsFullAccessUsageDescription:
        'WeDo saves planned dates to your calendar when you choose to add a reminder.',
      LSApplicationQueriesSchemes: ['comgooglemaps'],
    },
  },
  android: {
    package: 'com.wedo.app',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#A48362',
      monochromeImage: './assets/notification-icon.png',
    },
    permissions: ['RECEIVE_BOOT_COMPLETED', 'POST_NOTIFICATIONS'],
  },
  web: {
    favicon: './assets/TekLogo.png',
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000',
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? '4a68916f-7f20-44ff-ba03-22e50eaa4774',
    },
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
