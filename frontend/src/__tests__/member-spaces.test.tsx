import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Alert } from 'react-native';

import HomeScreen from '@/app/(tabs)/index';
import LeaveSpaceScreen from '@/app/space/[spaceId]/leave';
import MemberProfileScreen from '@/app/space/[spaceId]/member/[memberId]';
import { collaborationApi, type SpaceMember } from '@/features/collaboration/api';
import { i18n } from '@/i18n';

let mockParams: Record<string, string> = {};
const mockSetSpace = jest.fn();
const mockUser = { id: 'alice', display_name: 'Alice', email: 'alice@example.com' };
const mockSpaceState = { selectedSpaceId: 'space-1', setSelectedSpaceId: mockSetSpace };
const mockMembers: SpaceMember[] = [
  {
    id: 'member-a',
    user_id: 'alice',
    display_name: 'Alice',
    role: 'member',
    joined_at: '2026-10-20T10:00:00Z',
    is_active: true,
  },
  {
    id: 'member-b',
    user_id: 'bob',
    display_name: 'Bob',
    role: 'owner',
    joined_at: '2026-10-19T10:00:00Z',
    is_active: true,
  },
];
const mockSpaces = [{ id: 'space-1', name: 'Our space', type: 'couple' }];
const page = <T,>(data: T[]) => ({
  data,
  pagination: { page: 1, page_size: 50, has_more: false },
});

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), canGoBack: () => false },
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@/store/auth-store', () => ({
  useAuthStore: (select: any) => select({ user: mockUser }),
}));
jest.mock('@/store/space-store', () => ({
  useSpaceStore: Object.assign((select: any) => select(mockSpaceState), {
    getState: () => mockSpaceState,
  }),
}));
jest.mock('@/features/collaboration/api', () => ({
  collaborationApi: {
    allMembers: jest.fn(),
    member: jest.fn(),
    leaveSpace: jest.fn(),
    members: jest.fn(),
  },
}));
jest.mock('@/features/spaces/hooks', () => ({
  useSpaces: () => ({ data: { data: mockSpaces }, isSuccess: true, isLoading: false }),
}));
jest.mock('@/features/collaboration/hooks', () => ({
  useSpaceMembers: () => ({ data: { data: mockMembers }, isSuccess: true }),
}));
jest.mock('@/features/lists/hooks', () => ({
  useLists: () => ({ data: { data: [] }, isLoading: false }),
  useCreateList: () => ({ mutate: jest.fn() }),
}));
jest.mock('@/features/items/api', () => ({ itemsApi: {} }));
jest.mock('@/components/motion/ScreenMotion', () => ({
  ScreenMotion: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@/components/feedback/AppToast', () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));
jest.mock('@/features/safety/SafetyActions', () => ({ SafetyActions: () => null }));
jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

function screen(child: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return {
    client,
    ...render(<QueryClientProvider client={client}>{child}</QueryClientProvider>),
  };
}
beforeEach(async () => {
  jest.clearAllMocks();
  mockParams = { spaceId: 'space-1', memberId: 'member-b' };
  await i18n.changeLanguage('en');
  jest.mocked(collaborationApi.members).mockResolvedValue(page(mockMembers));
  jest.mocked(collaborationApi.allMembers).mockResolvedValue(page(mockMembers));
  jest.mocked(collaborationApi.member).mockResolvedValue(mockMembers[1]!);
  jest.mocked(collaborationApi.leaveSpace).mockResolvedValue(undefined);
});
beforeAll(() =>
  notifyManager.setNotifyFunction((callback) => {
    act(() => callback());
  }),
);
afterAll(() => notifyManager.setNotifyFunction((callback) => callback()));
afterEach(() => jest.restoreAllMocks());

it('opens a member from the home header', () => {
  const ui = screen(<HomeScreen />);
  fireEvent.press(ui.getByRole('button', { name: 'View information about Bob' }));
  expect(router.push).toHaveBeenCalledWith('/space/space-1/member/member-b');
  expect(mockSetSpace).not.toHaveBeenCalled();
});

it('opens member information from the space selector without selecting a space', async () => {
  const ui = screen(<HomeScreen />);
  fireEvent.press(ui.getAllByRole('button', { name: 'Switch space' })[0]!);
  await waitFor(() =>
    expect(
      ui.getAllByRole('button', { name: 'View information about Bob' }),
    ).toHaveLength(2),
  );
  fireEvent.press(
    ui.getAllByRole('button', { name: 'View information about Bob' }).at(-1)!,
  );
  expect(router.push).toHaveBeenCalledWith('/space/space-1/member/member-b');
  expect(mockSetSpace).not.toHaveBeenCalled();
});

it('opens the voluntary leave screen from the space selector', async () => {
  const ui = screen(<HomeScreen />);
  fireEvent.press(ui.getAllByRole('button', { name: 'Switch space' })[0]!);
  await waitFor(() =>
    expect(
      ui.getAllByRole('button', { name: 'View information about Bob' }),
    ).toHaveLength(2),
  );
  fireEvent.press(await ui.findByRole('button', { name: 'Leave Our space' }));
  expect(router.push).toHaveBeenCalledWith('/space/space-1/leave');
});

it('shows the member role and join date without private account details', async () => {
  const ui = screen(<MemberProfileScreen />);
  expect(await ui.findByText('Bob')).toBeTruthy();
  expect(ui.getByText('Role in this space: Owner')).toBeTruthy();
  expect(ui.getByText(/^Joined:/)).toBeTruthy();
  expect(ui.queryByText('bob@example.com')).toBeNull();
  expect(collaborationApi.member).toHaveBeenCalledWith('space-1', 'member-b');
});

it('leaves only after confirmation and clears old space data', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const ui = screen(<LeaveSpaceScreen />);
  ui.client.setQueryData(['items', 'old'], { title: 'Shared data' });
  fireEvent.press(await ui.findByRole('button', { name: 'Leave space' }));
  expect(collaborationApi.leaveSpace).not.toHaveBeenCalled();
  const confirm = alert.mock.calls[0]?.[2]?.find(
    (button) => button.style === 'destructive',
  );
  await act(async () => {
    confirm?.onPress?.();
  });
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/(tabs)'));
  expect(collaborationApi.leaveSpace).toHaveBeenCalledWith('space-1', undefined);
  expect(ui.client.getQueryData(['items', 'old'])).toBeUndefined();
  expect(mockSetSpace).toHaveBeenCalledWith(undefined);
});

it('requires the owner to select a successor before confirming departure', async () => {
  jest.mocked(collaborationApi.allMembers).mockResolvedValue(
    page([
      { ...mockMembers[0]!, role: 'owner' },
      { ...mockMembers[1]!, role: 'member' },
    ]),
  );
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const ui = screen(<LeaveSpaceScreen />);
  expect(await ui.findByText('Choose the next owner before leaving.')).toBeTruthy();
  fireEvent.press(ui.getByRole('button', { name: 'Leave space' }));
  expect(alert).not.toHaveBeenCalled();
  fireEvent.press(ui.getByRole('radio', { name: 'Bob' }));
  fireEvent.press(ui.getByRole('button', { name: 'Leave space' }));
  expect(alert.mock.calls[0]?.[1]).toContain('Ownership will transfer to Bob');
  const confirm = alert.mock.calls[0]?.[2]?.find(
    (button) => button.style === 'destructive',
  );
  await act(async () => {
    confirm?.onPress?.();
  });
  await waitFor(() =>
    expect(collaborationApi.leaveSpace).toHaveBeenCalledWith('space-1', 'bob'),
  );
});

it('preserves the current space and displays an error if leaving fails', async () => {
  jest
    .mocked(collaborationApi.leaveSpace)
    .mockRejectedValue(new Error('Connection failed'));
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const ui = screen(<LeaveSpaceScreen />);
  ui.client.setQueryData(['items', 'old'], { title: 'Shared data' });
  fireEvent.press(await ui.findByRole('button', { name: 'Leave space' }));
  const confirm = alert.mock.calls[0]?.[2]?.find(
    (button) => button.style === 'destructive',
  );
  await act(async () => {
    confirm?.onPress?.();
  });
  expect(await ui.findByText('Connection failed')).toBeTruthy();
  expect(router.replace).not.toHaveBeenCalled();
  expect(mockSetSpace).not.toHaveBeenCalled();
  expect(ui.client.getQueryData(['items', 'old'])).toEqual({ title: 'Shared data' });
});
