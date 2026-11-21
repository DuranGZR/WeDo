const mockGetItem = jest.fn();
const mockSetItem = jest.fn();
const mockRemoveItem = jest.fn();
const mockApiClient = jest.fn();
const mockGetTokens = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: mockGetItem,
    setItem: mockSetItem,
    removeItem: mockRemoveItem,
  },
}));
jest.mock('@/i18n', () => ({ t: (key: string) => key }));
jest.mock('@/api/client/api-client', () => ({
  apiClient: mockApiClient,
  ApiClientError: class extends Error {},
}));
jest.mock('@/api/client/authenticated-api-client', () => ({
  authenticatedApiClient: jest.fn(),
}));
jest.mock('@/lib/secure-storage', () => ({
  secureStorage: { getTokens: mockGetTokens, setTokens: jest.fn(), clear: jest.fn() },
}));

function stores() {
  return {
    spaces:
      jest.requireActual<typeof import('@/store/space-store')>('@/store/space-store')
        .useSpaceStore,
    auth: jest.requireActual<typeof import('@/store/auth-store')>('@/store/auth-store')
      .useAuthStore,
  };
}

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  mockGetItem.mockResolvedValue('first-space');
  mockSetItem.mockResolvedValue(undefined);
  mockRemoveItem.mockResolvedValue(undefined);
  mockGetTokens.mockResolvedValue({
    accessToken: 'saved-access',
    refreshToken: 'saved-refresh',
  });
  mockApiClient.mockResolvedValue({ id: 'alice' });
});

it('keeps the saved space when the existing session is restored on launch', async () => {
  const { spaces, auth } = stores();
  // The stored selection finishes loading before the slower session request.
  await spaces.getState().hydrate();
  expect(spaces.getState().selectedSpaceId).toBe('first-space');

  await auth.getState().hydrate();

  expect(auth.getState().user?.id).toBe('alice');
  expect(spaces.getState().selectedSpaceId).toBe('first-space');
  expect(mockRemoveItem).not.toHaveBeenCalled();
});

it('does not let a late storage read overwrite a newly selected space', async () => {
  let finish!: (value: string | null) => void;
  mockGetItem.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const { spaces } = stores();
  const pending = spaces.getState().hydrate();

  spaces.getState().setSelectedSpaceId('chosen-space');
  finish('old-space');
  await pending;

  expect(spaces.getState().selectedSpaceId).toBe('chosen-space');
  expect(mockSetItem).toHaveBeenCalledWith('wedo.selected-space', 'chosen-space');
});

it.each(['logout', 'account switch'])('clears the selection on %s', async (change) => {
  const { spaces, auth } = stores();
  await spaces.getState().hydrate();
  await auth.getState().hydrate();

  auth.setState({
    user: change === 'logout' ? null : { ...auth.getState().user!, id: 'bob' },
  });

  expect(spaces.getState().selectedSpaceId).toBeUndefined();
  expect(mockRemoveItem).toHaveBeenCalledWith('wedo.selected-space');
});

it('does not restore an old selection after a fresh sign-in resets it', async () => {
  let finish!: (value: string | null) => void;
  mockGetItem.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const { spaces, auth } = stores();
  const pending = spaces.getState().hydrate();
  auth.setState({ hydrated: true });
  auth.setState({
    user: { id: 'bob' } as NonNullable<ReturnType<typeof auth.getState>['user']>,
  });
  finish('alice-space');
  await pending;

  expect(spaces.getState().selectedSpaceId).toBeUndefined();
});

it('allows startup to finish when reading the saved selection fails', async () => {
  mockGetItem.mockRejectedValueOnce(new Error('Storage unavailable'));
  const { spaces, auth } = stores();

  await expect(spaces.getState().hydrate()).resolves.toBeUndefined();
  await auth.getState().hydrate();

  expect(auth.getState().hydrated).toBe(true);
  expect(spaces.getState().selectedSpaceId).toBeUndefined();
});
