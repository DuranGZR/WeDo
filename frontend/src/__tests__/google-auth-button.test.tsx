import { fireEvent, render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { getGoogleIdToken } from '@/lib/google-auth';
import { i18n } from '@/i18n';

const mockToast = jest.fn();
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
jest.mock('@/components/feedback/AppToast', () => ({
  useToast: () => ({ showToast: mockToast }),
}));
jest.mock('@/store/auth-store', () => ({
  useAuthStore: (select: any) => select({ signInWithGoogle: jest.fn() }),
}));
jest.mock('@/lib/google-auth', () => ({ getGoogleIdToken: jest.fn() }));

it('shows Google on web and explains that native sign-in needs the iPhone app', async () => {
  const platform = Platform.OS;
  Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
  try {
    await i18n.changeLanguage('en');
    const ui = render(<GoogleAuthButton />);
    fireEvent.press(ui.getByRole('button', { name: 'Continue with Google' }));
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'info' }));
    expect(getGoogleIdToken).not.toHaveBeenCalled();
  } finally {
    Object.defineProperty(Platform, 'OS', { value: platform, configurable: true });
  }
});
