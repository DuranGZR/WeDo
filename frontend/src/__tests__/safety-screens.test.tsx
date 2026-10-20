import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Alert } from 'react-native';

import ReportScreen from '@/app/settings/report';
import BlockedUsersScreen from '@/app/settings/blocked-users';
import { SafetyActions } from '@/features/safety/SafetyActions';
import { safetyApi } from '@/features/safety/api';
import { i18n } from '@/i18n';

let mockParams: Record<string, string> = {};
let mockUserId = 'alice';
const mockSetSpace = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), canGoBack: () => false },
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@/store/auth-store', () => ({
  useAuthStore: (select: any) => select({ user: { id: mockUserId } }),
}));
jest.mock('@/store/space-store', () => ({
  useSpaceStore: { getState: () => ({ setSelectedSpaceId: mockSetSpace }) },
}));
jest.mock('@/features/safety/api', () => ({
  safetyApi: {
    report: jest.fn(),
    block: jest.fn(),
    blocks: jest.fn(),
    unblock: jest.fn(),
  },
}));
jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

function screen(child: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  return {
    client,
    ...render(<QueryClientProvider client={client}>{child}</QueryClientProvider>),
  };
}

beforeEach(async () => {
  jest.clearAllMocks();
  mockParams = {};
  mockUserId = 'alice';
  await i18n.changeLanguage('en');
});
afterEach(() => jest.restoreAllMocks());

it('validates a report, sends its actual target and shows its receipt', async () => {
  mockParams = {
    targetType: 'item',
    targetId: 'item-1',
    spaceId: 'space-1',
    name: 'Bob',
  };
  jest
    .mocked(safetyApi.report)
    .mockResolvedValue({ id: 'receipt-1', status: 'pending', created_at: '2026-10-20' });
  const ui = screen(<ReportScreen />);
  fireEvent.press(ui.getByRole('button', { name: 'Send report' }));
  expect(safetyApi.report).not.toHaveBeenCalled();
  fireEvent.press(ui.getByRole('radio', { name: 'Violence or threats' }));
  fireEvent.changeText(ui.getByLabelText('Details'), 'This link contains threats.');
  fireEvent.press(ui.getByRole('button', { name: 'Send report' }));
  expect(await ui.findByText('Report received')).toBeTruthy();
  expect(ui.getByText('Reference: receipt-1')).toBeTruthy();
  expect(safetyApi.report).toHaveBeenCalledWith({
    target_type: 'item',
    target_id: 'item-1',
    space_id: 'space-1',
    reason: 'violence',
    details: 'This link contains threats.',
  });
});

it('keeps report details after failure and supports retry', async () => {
  jest
    .mocked(safetyApi.report)
    .mockRejectedValueOnce(new Error('Network unavailable'))
    .mockResolvedValueOnce({
      id: 'receipt-2',
      status: 'pending',
      created_at: '2026-10-20',
    });
  const ui = screen(<ReportScreen />);
  fireEvent.changeText(ui.getByLabelText('Details'), 'A problem needs review.');
  fireEvent.press(ui.getByRole('button', { name: 'Send report' }));
  expect(await ui.findByText('Network unavailable')).toBeTruthy();
  expect(ui.getByLabelText('Details').props.value).toBe('A problem needs review.');
  fireEvent.press(ui.getByRole('button', { name: 'Send report' }));
  expect(await ui.findByText('Report received')).toBeTruthy();
});

it('keeps entered report details when the app language changes', async () => {
  const ui = screen(<ReportScreen />);
  fireEvent.changeText(ui.getByLabelText('Details'), 'A problem needs review.');
  await act(async () => {
    await i18n.changeLanguage('tr');
  });
  expect(ui.getByLabelText('Açıklama').props.value).toBe('A problem needs review.');
  expect(ui.getByRole('button', { name: 'Bildirimi gönder' })).toBeTruthy();
});

it('requires block confirmation, clears shared caches and resets the space selection', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  jest.mocked(safetyApi.block).mockResolvedValue(undefined);
  const ui = screen(
    <SafetyActions userId="bob" displayName="Bob" itemId="item-1" spaceId="space-1" />,
  );
  ui.client.setQueryData(['items', 'private-item'], { title: 'Old shared content' });
  fireEvent.press(ui.getByRole('button', { name: 'Block user' }));
  expect(safetyApi.block).not.toHaveBeenCalled();
  expect(alert.mock.calls[0]?.[1]).toContain(
    'you will leave shared spaces you do not own',
  );
  const confirm = alert.mock.calls[0]?.[2]?.find(
    (button) => button.style === 'destructive',
  );
  await act(async () => {
    confirm?.onPress?.();
  });
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/(tabs)'));
  expect(safetyApi.block).toHaveBeenCalledWith('bob');
  expect(ui.client.getQueryData(['items', 'private-item'])).toBeUndefined();
  expect(mockSetSpace).toHaveBeenCalledWith(undefined);
});

it('keeps shared caches and the current screen if blocking fails', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  jest.mocked(safetyApi.block).mockRejectedValue(new Error('Server unavailable'));
  const ui = screen(<SafetyActions userId="bob" displayName="Bob" spaceId="space-1" />);
  ui.client.setQueryData(['items', 'item-1'], { title: 'Still authorized' });
  fireEvent.press(ui.getByRole('button', { name: 'Block user' }));
  const confirm = alert.mock.calls[0]?.[2]?.find(
    (button) => button.style === 'destructive',
  );
  await act(async () => {
    confirm?.onPress?.();
  });
  await waitFor(() =>
    expect(alert).toHaveBeenCalledWith('Could not complete action', 'Server unavailable'),
  );
  expect(ui.client.getQueryData(['items', 'item-1'])).toEqual({
    title: 'Still authorized',
  });
  expect(router.replace).not.toHaveBeenCalled();
  expect(mockSetSpace).not.toHaveBeenCalled();
});

it('does not let the current user block themselves', () => {
  const ui = screen(
    <SafetyActions userId="alice" displayName="Alice" spaceId="space-1" />,
  );
  expect(ui.queryByRole('button', { name: 'Block user' })).toBeNull();
});

it('shows blocked users and removes a successful unblock from the list', async () => {
  const page = { pagination: { page: 1, page_size: 50, has_more: false } };
  jest
    .mocked(safetyApi.blocks)
    .mockResolvedValueOnce({
      ...page,
      data: [{ user_id: 'bob', display_name: 'Bob', created_at: '2026-10-20' }],
    })
    .mockResolvedValue({ ...page, data: [] });
  jest.mocked(safetyApi.unblock).mockResolvedValue(undefined);
  const ui = screen(<BlockedUsersScreen />);
  expect(await ui.findByText('Bob')).toBeTruthy();
  fireEvent.press(ui.getByRole('button', { name: 'Unblock' }));
  expect(await ui.findByText('You have not blocked anyone.')).toBeTruthy();
  expect(safetyApi.unblock).toHaveBeenCalledWith('bob', expect.anything());
});
