import { apiClient, ApiClientError } from '@/api/client/api-client';
import { authenticatedApiClient } from '@/api/client/authenticated-api-client';
import { queryClient } from '@/api/query-client';
import { useAuthStore } from '@/store/auth-store';
import { useSpaceStore } from '@/store/space-store';
import { secureStorage } from '@/lib/secure-storage';
import type { User } from '@/api/schemas';

jest.mock('@/lib/env', () => ({ env: { apiUrl: 'https://api.test' } }));
jest.mock('@/api/client/api-client', () => {
  const actual = jest.requireActual('@/api/client/api-client');
  return { ...actual, apiClient: jest.fn() };
});
jest.mock('@/lib/secure-storage', () => ({
  secureStorage: { getTokens: jest.fn(), setTokens: jest.fn(), clear: jest.fn() },
}));
jest.mock('@/store/space-store', () => ({
  useSpaceStore: { getState: () => ({ setSelectedSpaceId: jest.fn() }) },
}));

const user = (id = 'alice'): User => ({
  id,
  email: `${id}@example.com`,
  display_name: id,
  avatar_url: null,
  email_verified: true,
  onboarding_completed: true,
  has_password: true,
  notify_partner_activity: true,
  push_notifications_enabled: true,
  preferred_language: 'en',
  created_at: '2026-10-16T00:00:00Z',
});
const result = {
  access_token: 'new-access',
  refresh_token: 'new-refresh',
  token_type: 'bearer',
  user: user(),
};

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ user: user(), accessToken: 'old-access', hydrated: true });
  jest
    .mocked(secureStorage.getTokens)
    .mockResolvedValue({ accessToken: 'old-access', refreshToken: 'old-refresh' });
  jest.mocked(secureStorage.setTokens).mockResolvedValue(undefined);
  jest.mocked(secureStorage.clear).mockResolvedValue(undefined);
});
afterEach(() => queryClient.clear());

it('rotates one refresh token once when several requests expire together', async () => {
  jest.mocked(apiClient).mockResolvedValue(result);
  await expect(
    Promise.all([
      useAuthStore.getState().refresh(),
      useAuthStore.getState().refresh(),
      useAuthStore.getState().refresh(),
    ]),
  ).resolves.toEqual([true, true, true]);
  expect(apiClient).toHaveBeenCalledTimes(1);
  expect(secureStorage.setTokens).toHaveBeenCalledTimes(1);
  expect(useAuthStore.getState().accessToken).toBe('new-access');
});

it('keeps credentials on a transient server failure but clears rejected credentials', async () => {
  jest.mocked(apiClient).mockRejectedValueOnce(new ApiClientError(503, {}));
  expect(await useAuthStore.getState().refresh()).toBe(false);
  expect(secureStorage.clear).not.toHaveBeenCalled();
  expect(useAuthStore.getState().user?.id).toBe('alice');
  jest.mocked(apiClient).mockRejectedValueOnce(new ApiClientError(401, {}));
  expect(await useAuthStore.getState().refresh()).toBe(false);
  expect(useAuthStore.getState().user).toBeNull();
});

it('clears the previous account cache on logout and account changes', () => {
  queryClient.setQueryData(['spaces'], { private: 'alice data' });
  useAuthStore.setState({ user: user('bob'), accessToken: 'bob-access' });
  expect(queryClient.getQueryData(['spaces'])).toBeUndefined();
  queryClient.setQueryData(['spaces'], { private: 'bob data' });
  useAuthStore.setState({ user: null, accessToken: null });
  expect(queryClient.getQueryData(['spaces'])).toBeUndefined();
  expect(useSpaceStore.getState()).toHaveProperty('setSelectedSpaceId');
});

it('does not restore a logged-out session when a delayed refresh finishes', async () => {
  let complete!: (value: unknown) => void;
  jest.mocked(apiClient).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  const pending = useAuthStore.getState().refresh();
  await Promise.resolve();
  useAuthStore.setState({ user: null, accessToken: null });
  complete(result);
  expect(await pending).toBe(false);
  expect(secureStorage.setTokens).not.toHaveBeenCalled();
  expect(useAuthStore.getState().user).toBeNull();
});

it('does not replay an old account mutation using the next account token', async () => {
  jest.mocked(apiClient).mockResolvedValue(undefined);
  await authenticatedApiClient('/api/v1/users/me', {
    method: 'PATCH',
    body: { display_name: 'Alice' },
  });
  const options = jest.mocked(apiClient).mock.calls[0]![1]!;
  useAuthStore.setState({ user: user('bob'), accessToken: 'bob-access' });
  expect(await options.refresh!()).toBeNull();
});
