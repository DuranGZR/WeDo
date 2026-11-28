import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';

import NotFound from '@/app/+not-found';
import SignInScreen from '@/app/(auth)/sign-in';
import SignUpScreen from '@/app/(auth)/sign-up';
import WelcomeScreen from '@/app/(auth)/welcome';
import ShareTutorialScreen from '@/app/(onboarding)/share-tutorial';
import UsageTypeScreen from '@/app/(onboarding)/usage-type';
import LegalPrivacyScreen from '@/app/legal/privacy';
import LegalTermsScreen from '@/app/legal/terms';
import { i18n, t } from '@/i18n';

const mockSignIn = jest.fn(() => Promise.resolve());

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: () => true,
  },
  useLocalSearchParams: () => ({}),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@expo/vector-icons/Ionicons', () => () => null);
jest.mock('expo-apple-authentication', () => ({
  AppleAuthenticationButtonType: {
    CONTINUE: 0,
    SIGN_IN: 1,
    SIGN_UP: 2,
  },
  AppleAuthenticationScope: {
    FULL_NAME: 0,
    EMAIL: 1,
  },
  isAvailableAsync: jest.fn(() => Promise.resolve(false)),
}));
jest.mock('@/components/feedback/AppToast', () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));
jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);
jest.mock('@/store/auth-store', () => ({
  useAuthStore: (
    select: (state: {
      signIn: typeof mockSignIn;
      signInWithApple: () => Promise<void>;
      signInWithGoogle: () => Promise<void>;
    }) => unknown,
  ) =>
    select({
      signIn: mockSignIn,
      signInWithApple: jest.fn(),
      signInWithGoogle: jest.fn(),
    }),
}));

describe('Auth, Onboarding, Legal & Fallback Liquid Glass screens', () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    await i18n.changeLanguage('tr');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders WelcomeScreen hero and navigates to sign-up and sign-in', () => {
    const ui = render(<WelcomeScreen />);
    expect(ui.getByText('WeDo.')).toBeTruthy();
    expect(ui.getByRole('tab', { name: 'Nomo Ramen 🍜' })).toHaveProp(
      'accessibilityState',
      { selected: true },
    );

    fireEvent.press(ui.getByRole('button', { name: t('auth.showTheNextSavedItem') }));
    expect(ui.getByRole('tab', { name: t('auth.nikeShoes') })).toHaveProp(
      'accessibilityState',
      { selected: true },
    );

    fireEvent.press(ui.getByRole('button', { name: t('auth.createAccount') }));
    expect(router.push).toHaveBeenCalledWith('/(auth)/sign-up');

    fireEvent.press(ui.getByRole('button', { name: t('common.signIn') }));
    expect(router.push).toHaveBeenCalledWith('/(auth)/sign-in');

    ui.unmount();
  });

  it('reveals password strength checks on SignUpScreen only when focused or typed', () => {
    const ui = render(<SignUpScreen />);
    expect(ui.queryByText(t('auth.atLeast8Characters'))).toBeNull();

    const passwordInput = ui.getByLabelText(t('common.password'));
    fireEvent(passwordInput, 'focus');
    expect(ui.getByText(t('auth.atLeast8Characters'))).toBeTruthy();
  });

  it('renders SignInScreen with glass AuthShell back control and pill buttons', () => {
    const ui = render(<SignInScreen />);

    expect(ui.getByText(t('auth.welcomeBack'))).toBeTruthy();
    expect(ui.getByRole('button', { name: t('common.signIn') })).toBeTruthy();

    fireEvent.press(ui.getByRole('button', { name: t('common.goBack_e0c40') }));
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('renders UsageTypeScreen and enables continue after selecting an option', () => {
    const ui = render(<UsageTypeScreen />);

    fireEvent.press(ui.getByText(t('onboarding.withMyPartner')));
    fireEvent.press(ui.getByText(t('onboarding.continue')));
    expect(router.push).toHaveBeenCalledWith('/(onboarding)/list-templates');
  });

  it('renders ShareTutorialScreen steps and primary navigation actions', () => {
    const ui = render(<ShareTutorialScreen />);

    expect(ui.getByText(t('onboarding.saveWhatYouDiscoverToWedo'))).toBeTruthy();
    fireEvent.press(ui.getByRole('button', { name: t('onboarding.gotIt') }));
    expect(router.replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('renders LegalPrivacyScreen, LegalTermsScreen, and NotFound with back navigation', () => {
    const privacy = render(<LegalPrivacyScreen />);
    expect(privacy.getByText(t('common.privacyPolicy'))).toBeTruthy();
    fireEvent.press(privacy.getByRole('button', { name: t('legal.close') }));
    expect(router.back).toHaveBeenCalledTimes(1);

    const terms = render(<LegalTermsScreen />);
    expect(terms.getByText(t('common.termsOfServiceAndEula'))).toBeTruthy();
    fireEvent.press(terms.getByRole('button', { name: t('legal.close') }));
    expect(router.back).toHaveBeenCalledTimes(2);

    const notFound = render(<NotFound />);
    expect(notFound.getByText(t('common.pageNotFound'))).toBeTruthy();
    fireEvent.press(notFound.getByRole('button', { name: t('common.goBack') }));
    expect(router.back).toHaveBeenCalledTimes(3);
  });
});
