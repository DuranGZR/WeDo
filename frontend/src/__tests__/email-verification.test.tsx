import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import VerifyEmailScreen from '@/app/(auth)/verify-email';
import { resendVerification, verifyEmail } from '@/features/auth/email-verification';
import { i18n } from '@/i18n';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
  useLocalSearchParams: () => ({
    email: 'test@example.com',
    verificationId: 'challenge-id',
    resendAfter: '0',
    inviteToken: 'test-invite',
  }),
}));
jest.mock('@/features/auth/email-verification', () => ({
  verifyEmail: jest.fn(),
  resendVerification: jest.fn(),
}));
jest.mock('@/components/auth/AuthShell', () => {
  const React = jest.requireActual('react');
  const { View, Text } = jest.requireActual('react-native');
  return {
    authColors: { ink: '#000000', paper: '#FFFFFF' },
    AuthShell: ({ title, children }: { title: string; children: unknown }) =>
      React.createElement(View, null, React.createElement(Text, null, title), children),
  };
});
jest.mock('@/components/ui', () => {
  const React = jest.requireActual('react');
  const { Text, TextInput } = jest.requireActual('react-native');
  return {
    AppText: ({ children }: { children: unknown }) =>
      React.createElement(Text, null, children),
    TextField: ({ label, ...props }: { label: string }) =>
      React.createElement(TextInput, { ...props, accessibilityLabel: label }),
  };
});

describe('Email verification screen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await i18n.changeLanguage('tr');
  });

  it('keeps the verification code and invitation when switching to English', async () => {
    jest.mocked(verifyEmail).mockResolvedValue(undefined);
    const screen = render(<VerifyEmailScreen />);
    fireEvent.changeText(screen.getByLabelText('Doğrulama kodu'), '123456');
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    expect(screen.getByLabelText('Verification code').props.value).toBe('123456');
    fireEvent.press(screen.getByRole('button', { name: 'Verify email' }));
    await waitFor(() => expect(screen.getByText('Email verified')).toBeTruthy());
    fireEvent.press(screen.getByText('Sign in'));
    expect(verifyEmail).toHaveBeenCalledWith('challenge-id', '123456');
    expect(router.replace).toHaveBeenCalledWith({
      pathname: '/(auth)/sign-in',
      params: { email: 'test@example.com', inviteToken: 'test-invite' },
    });
  });

  it('requires six digits, verifies and preserves the invitation at login', async () => {
    jest.mocked(verifyEmail).mockResolvedValue(undefined);
    const screen = render(<VerifyEmailScreen />);
    const button = screen.getByRole('button', { name: 'E-postamı doğrula' });
    expect(button.props.accessibilityState.disabled).toBe(true);
    fireEvent.changeText(screen.getByLabelText('Doğrulama kodu'), '12ab');
    expect(screen.getByLabelText('Doğrulama kodu').props.value).toBe('12');
    fireEvent.changeText(screen.getByLabelText('Doğrulama kodu'), '123456');
    fireEvent.press(button);
    await waitFor(() => expect(screen.getByText('E-postan doğrulandı')).toBeTruthy());
    expect(verifyEmail).toHaveBeenCalledWith('challenge-id', '123456');
    fireEvent.press(screen.getByText('Giriş yap'));
    expect(router.replace).toHaveBeenCalledWith({
      pathname: '/(auth)/sign-in',
      params: { email: 'test@example.com', inviteToken: 'test-invite' },
    });
  });

  it('shows a failed code without claiming confirmation', async () => {
    jest.mocked(verifyEmail).mockRejectedValue(new Error('Kod geçersiz'));
    const screen = render(<VerifyEmailScreen />);
    fireEvent.changeText(screen.getByLabelText('Doğrulama kodu'), '123456');
    fireEvent.press(screen.getByRole('button', { name: 'E-postamı doğrula' }));
    await waitFor(() => expect(screen.getByText('Kod geçersiz')).toBeTruthy());
    expect(screen.queryByText('E-postan doğrulandı')).toBeNull();
  });

  it('applies server resend cooldown after requesting a new code', async () => {
    jest.mocked(resendVerification).mockResolvedValue({
      verification_id: 'challenge-id',
      email: 'test@example.com',
      resend_after_seconds: 60,
      expires_in_seconds: 600,
    });
    const screen = render(<VerifyEmailScreen />);
    fireEvent.press(screen.getByText('Kodu tekrar gönder'));
    await waitFor(() =>
      expect(screen.getByText('Yeni kod için 60 saniye bekle')).toBeTruthy(),
    );
    expect(resendVerification).toHaveBeenCalledTimes(1);
  });
});
