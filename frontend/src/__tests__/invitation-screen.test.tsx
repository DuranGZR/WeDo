import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import InviteScreen from '@/app/invite/[token]';
import { ApiClientError } from '@/api/client/api-client';
import { collaborationApi } from '@/features/collaboration/api';
import { i18n } from '@/i18n';

let mockSignedIn = false;
let mockMember = false;
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({ token: 'test-invite' }),
}));
jest.mock('@/store/auth-store', () => ({
  useAuthStore: (select: any) => select({ user: mockSignedIn ? { id: 'user' } : null }),
}));
jest.mock('@/store/space-store', () => ({
  useSpaceStore: { getState: () => ({ setSelectedSpaceId: jest.fn() }) },
}));
jest.mock('@/features/spaces/hooks', () => ({
  useSpaces: () => ({
    data: { data: mockMember ? [{ id: 'space' }] : [] },
    isPending: false,
    isError: false,
  }),
}));
jest.mock('@/features/collaboration/api', () => ({
  collaborationApi: { invitation: jest.fn(), acceptInvitation: jest.fn() },
}));
jest.mock('@/lib/haptics', () => ({ haptic: { trigger: jest.fn() } }));

const preview = {
  id: 'invite',
  space_id: 'space',
  space_name: 'Our space',
  inviter_name: 'Alex',
  expires_at: '2027-01-01',
};
function screen() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <InviteScreen />
    </QueryClientProvider>,
  );
}
beforeEach(async () => {
  jest.clearAllMocks();
  mockSignedIn = false;
  mockMember = false;
  await i18n.changeLanguage('en');
  jest.mocked(collaborationApi.invitation).mockResolvedValue(preview);
  jest.mocked(collaborationApi.acceptInvitation).mockResolvedValue(preview);
});
it('shows a real invitation and preserves its token when signing in', async () => {
  const ui = screen();
  fireEvent.press(await ui.findByText('Sign in to join'));
  expect(ui.getByText('Our space')).toBeTruthy();
  expect(router.push).toHaveBeenCalledWith({
    pathname: '/(auth)/sign-in',
    params: { inviteToken: 'test-invite' },
  });
});
it('accepts a new membership and opens the accepted screen', async () => {
  mockSignedIn = true;
  const ui = screen();
  fireEvent.press(await ui.findByText('Join space'));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/invite/accepted'));
  expect(collaborationApi.acceptInvitation).toHaveBeenCalledWith('test-invite');
});
it('opens an existing membership without accepting the invite again', async () => {
  mockSignedIn = true;
  mockMember = true;
  const ui = screen();
  fireEvent.press(await ui.findByText('Go to space'));
  expect(collaborationApi.acceptInvitation).not.toHaveBeenCalled();
  expect(router.replace).toHaveBeenCalledWith('/(tabs)');
});
it('distinguishes an invalid invite from a retryable network failure', async () => {
  jest
    .mocked(collaborationApi.invitation)
    .mockRejectedValueOnce(new ApiClientError(404, {}));
  const invalid = screen();
  expect(await invalid.findByText('This invite link is no longer valid.')).toBeTruthy();
  invalid.unmount();
  jest
    .mocked(collaborationApi.invitation)
    .mockRejectedValueOnce(new Error('Connection unavailable'));
  const failure = screen();
  fireEvent.press(await failure.findByText('Try again'));
  expect(await failure.findByText('Sign in to join')).toBeTruthy();
});
