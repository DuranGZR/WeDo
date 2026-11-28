import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import ProfileScreen from '@/app/(tabs)/profile';
import SettingsScreen from '@/app/settings/index';
import ManageSpacesScreen from '@/app/space/manage';
import { i18n, t } from '@/i18n';

const mockSignOut = jest.fn(() => Promise.resolve());
const mockUpdateProfile = jest.fn(() => Promise.resolve());
const mockUpdateSpace = jest.fn(() => Promise.resolve());
const mockDeleteSpace = jest.fn(() => Promise.resolve());
const mockRefetchSpaces = jest.fn();
const mockShowToast = jest.fn();

const mockAuthState = {
  user: {
    id: 'user-1',
    display_name: 'İpek',
    email: 'ipek@example.com',
    has_password: true,
  },
  signOut: mockSignOut,
  updateProfile: mockUpdateProfile,
};

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: () => true,
  },
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@/components/motion/ScreenMotion', () => ({
  ScreenMotion: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@/components/ui/LanguagePicker', () => ({
  LanguagePicker: () => null,
}));
jest.mock('@/components/feedback/AppToast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));
jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);
jest.mock('@/store/auth-store', () => ({
  useAuthStore: (selector?: (state: typeof mockAuthState) => unknown) =>
    selector ? selector(mockAuthState) : mockAuthState,
}));
jest.mock('@/features/spaces/hooks', () => ({
  useSpaces: () => ({
    data: {
      data: [
        {
          id: 'space-1',
          name: 'Bizim Alan',
          type: 'couple',
          member_count: 2,
        },
      ],
    },
    isLoading: false,
    refetch: mockRefetchSpaces,
  }),
  useUpdateSpace: () => ({ mutateAsync: mockUpdateSpace }),
  useDeleteSpace: () => ({ mutateAsync: mockDeleteSpace }),
}));

describe('Profile, Settings & Space Management Liquid Glass screens', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await i18n.changeLanguage('tr');
  });

  it('renders ProfileScreen identity card, menu rows, and sign-out confirmation', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const ui = render(<ProfileScreen />);

    expect(ui.getByText('İpek')).toBeTruthy();
    expect(ui.getByText('ipek@example.com')).toBeTruthy();

    fireEvent.press(ui.getByRole('button', { name: t('home.editProfile') }));
    expect(router.push).toHaveBeenCalledWith('/settings');

    fireEvent.press(ui.getByRole('button', { name: t('home.manageMySpaces') }));
    expect(router.push).toHaveBeenCalledWith('/space/manage');

    fireEvent.press(ui.getByRole('button', { name: t('home.signOutOfAllDevices') }));
    expect(alertSpy).toHaveBeenCalledTimes(1);
    alertSpy.mockRestore();
  });

  it('renders ManageSpacesScreen list, edit actions, and space creation navigation', () => {
    const ui = render(<ManageSpacesScreen />);

    expect(ui.getByText('Bizim Alan')).toBeTruthy();

    fireEvent.press(ui.getByText('Bizim Alan'));
    expect(ui.getByText(t('spaces.editSpace'))).toBeTruthy();
    expect(ui.getByRole('button', { name: t('members.leave') })).toBeTruthy();
    expect(ui.getByRole('button', { name: t('safety.members') })).toBeTruthy();

    fireEvent.press(ui.getByText(t('common.cancel')));
    expect(ui.getByText(t('spaces.yourSpaces'))).toBeTruthy();

    fireEvent.press(ui.getByText(t('spaces.createNewSpace')));
    expect(router.push).toHaveBeenCalledWith('/(onboarding)/usage-type');
  });

  it('renders SettingsScreen profile controls and saves updated display name', async () => {
    const ui = render(<SettingsScreen />);

    expect(ui.getByText('ipek@example.com')).toBeTruthy();
    expect(ui.getByText('İ')).toBeTruthy();

    const hapticSwitch = ui.getByRole('switch', { name: t('settings.hapticFeedback') });
    expect(hapticSwitch.props.accessibilityState).toEqual({ checked: true });
    fireEvent.press(hapticSwitch);
    await waitFor(() => {
      expect(
        ui.getByRole('switch', { name: t('settings.hapticFeedback') }).props
          .accessibilityState,
      ).toEqual({ checked: false });
    });

    fireEvent.changeText(ui.getByDisplayValue('İpek'), 'İpek Y.');
    fireEvent.press(ui.getByRole('button', { name: t('settings.saveProfileChanges') }));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({ displayName: 'İpek Y.' });
    });

    fireEvent.press(ui.getByRole('button', { name: t('common.goBack') }));
    expect(router.back).toHaveBeenCalledTimes(1);
  });
});
