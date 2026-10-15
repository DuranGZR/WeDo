import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { getGoogleIdToken } from '@/lib/google-auth';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { executionEnvironment: 'standalone' },
  ExecutionEnvironment: { StoreClient: 'storeClient' },
}));
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: { configure: jest.fn(), signIn: jest.fn() },
  isErrorWithCode: (error: { code?: string }) => typeof error?.code === 'string',
  statusCodes: { SIGN_IN_CANCELLED: 'cancelled', IN_PROGRESS: 'in-progress' },
}));

describe('Google native sign-in', () => {
  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    jest.replaceProperty(Constants, 'executionEnvironment', 'standalone' as never);
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = 'test-web-client';
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = 'test-ios-client';
    jest.mocked(GoogleSignin.signIn).mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    delete process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  });

  it('returns the real SDK ID token and configures basic sign-in', async () => {
    jest.mocked(GoogleSignin.signIn).mockResolvedValue({
      type: 'success',
      data: { idToken: 'signed-token' },
    } as never);
    await expect(getGoogleIdToken()).resolves.toBe('signed-token');
    expect(GoogleSignin.configure).toHaveBeenCalledWith({
      webClientId: 'test-web-client',
      iosClientId: 'test-ios-client',
      offlineAccess: false,
    });
  });

  it('does not treat user cancellation as an error', async () => {
    jest.mocked(GoogleSignin.signIn).mockResolvedValue({ type: 'cancelled', data: null });
    await expect(getGoogleIdToken()).resolves.toBeNull();
    jest.mocked(GoogleSignin.signIn).mockRejectedValue({ code: 'cancelled' });
    await expect(getGoogleIdToken()).resolves.toBeNull();
  });

  it('rejects a successful SDK result with no token', async () => {
    jest.mocked(GoogleSignin.signIn).mockResolvedValue({
      type: 'success',
      data: { idToken: null },
    } as never);
    await expect(getGoogleIdToken()).rejects.toThrow('Google kimlik bilgisi alınamadı');
  });

  it('rejects missing configuration before opening the SDK', async () => {
    delete process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    await expect(getGoogleIdToken()).rejects.toThrow('yapılandırılmadı');
    expect(GoogleSignin.signIn).not.toHaveBeenCalled();
  });

  it('handles native SDK failures without exposing technical errors', async () => {
    jest
      .mocked(GoogleSignin.signIn)
      .mockRejectedValue({ code: 'unknown', message: 'native detail' });
    await expect(getGoogleIdToken()).rejects.toThrow('Lütfen tekrar dene');
  });

  it('rejects Expo Go and unsupported platforms before loading native sign-in', async () => {
    jest.replaceProperty(Constants, 'executionEnvironment', 'storeClient' as never);
    await expect(getGoogleIdToken()).rejects.toThrow('TestFlight');
    jest.replaceProperty(Platform, 'OS', 'web');
    await expect(getGoogleIdToken()).rejects.toThrow('yalnızca iOS');
    expect(GoogleSignin.signIn).not.toHaveBeenCalled();
  });
});
