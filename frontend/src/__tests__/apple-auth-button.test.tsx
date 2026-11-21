import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import * as Apple from 'expo-apple-authentication';
import { AppleAuthButton } from '@/components/auth/AppleAuthButton';
import { i18n } from '@/i18n';

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
  return {
    AppleAuthenticationButtonType: { SIGN_IN: 0, SIGN_UP: 1, CONTINUE: 2 },
    AppleAuthenticationButtonStyle: { BLACK: 0 },
    AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
    isAvailableAsync: jest.fn().mockResolvedValue(true),
    signInAsync: jest.fn(),
  };
});

const originalOS = Platform.OS;
beforeEach(async () => {
  jest.clearAllMocks();
  Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
  await i18n.changeLanguage('en');
});
afterEach(() =>
  Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true }),
);

it('forwards the one-time authorization code for server token exchange', async () => {
  jest.mocked(Apple.signInAsync).mockResolvedValue({
    identityToken: 'signed-token',
    authorizationCode: 'one-time-code',
    user: 'apple-person',
    email: 'relay@example.com',
    fullName: { givenName: 'Alex', familyName: 'Example' },
  } as Apple.AppleAuthenticationCredential);
  const ui = render(<AppleAuthButton />);
  const button = ui.getByRole('button', { name: 'Continue with Apple' });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.press(button);
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
  const button = ui.getByRole('button', { name: 'Continue with Apple' });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.press(button);
  await waitFor(() => expect(Apple.signInAsync).toHaveBeenCalled());
  await ui.findByText('Continue with Apple');
  expect(mockSignIn).not.toHaveBeenCalled();
  expect(mockToast).not.toHaveBeenCalled();
});

it('updates the iOS sign-up label when the in-app language changes', async () => {
  const ui = render(
    <AppleAuthButton buttonType={Apple.AppleAuthenticationButtonType.SIGN_UP} />,
  );
  expect(ui.getByRole('button', { name: 'Sign up with Apple' })).toBeTruthy();

  await act(() => i18n.changeLanguage('tr'));
  expect(ui.getByRole('button', { name: 'Apple ile kaydol' })).toBeTruthy();
  expect(ui.queryByText('Sign up with Apple')).toBeNull();

  await act(() => i18n.changeLanguage('en'));
  expect(ui.getByRole('button', { name: 'Sign up with Apple' })).toBeTruthy();
});
