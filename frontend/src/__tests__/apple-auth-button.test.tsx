import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import * as Apple from 'expo-apple-authentication';
import { AppleAuthButton } from '@/components/auth/AppleAuthButton';

const mockSignIn = jest.fn().mockResolvedValue(undefined);
const mockToast = jest.fn();
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
jest.mock('@/components/feedback/AppToast', () => ({
  useToast: () => ({ showToast: mockToast }),
}));
jest.mock('@/store/auth-store', () => ({
  useAuthStore: (select: any) => select({ signInWithApple: mockSignIn }),
}));
jest.mock('expo-apple-authentication', () => {
  const { Pressable, Text } = require('react-native');
  return {
    AppleAuthenticationButtonType: { CONTINUE: 2 },
    AppleAuthenticationButtonStyle: { BLACK: 0 },
    AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
    isAvailableAsync: jest.fn().mockResolvedValue(true),
    signInAsync: jest.fn(),
    AppleAuthenticationButton: ({ onPress }: { onPress: () => void }) => (
      <Pressable onPress={onPress}>
        <Text>Native Apple sign-in</Text>
      </Pressable>
    ),
  };
});

const originalOS = Platform.OS;
beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
});
afterEach(() =>
  Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true }),
);

it('forwards the one-time authorization code for server token exchange', async () => {
  jest
    .mocked(Apple.signInAsync)
    .mockResolvedValue({
      identityToken: 'signed-token',
      authorizationCode: 'one-time-code',
      user: 'apple-person',
      email: 'relay@example.com',
      fullName: { givenName: 'Alex', familyName: 'Example' },
    } as Apple.AppleAuthenticationCredential);
  const ui = render(<AppleAuthButton />);
  fireEvent.press(await ui.findByText('Native Apple sign-in'));
  await waitFor(() =>
    expect(mockSignIn).toHaveBeenCalledWith(
      'signed-token',
      'apple-person',
      'relay@example.com',
      'Alex Example',
      'one-time-code',
    ),
  );
});

it('does not authenticate or show an error when the Apple sheet is cancelled', async () => {
  jest.mocked(Apple.signInAsync).mockRejectedValue({ code: 'ERR_REQUEST_CANCELED' });
  const ui = render(<AppleAuthButton />);
  fireEvent.press(await ui.findByText('Native Apple sign-in'));
  await waitFor(() => expect(Apple.signInAsync).toHaveBeenCalled());
  await ui.findByText('Native Apple sign-in');
  expect(mockSignIn).not.toHaveBeenCalled();
  expect(mockToast).not.toHaveBeenCalled();
});
