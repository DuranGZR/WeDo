import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';

import ItemDetailScreen from '@/app/item/[itemId]/index';
import NotificationsScreen from '@/app/notifications';
import { collaborationApi } from '@/features/collaboration/api';
import { i18n } from '@/i18n';

const mockComplete = jest.fn();
const mockUpdateItem = jest.fn();
const mockCreateComment = jest.fn();
const mockShowToast = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({ itemId: 'item-1' }),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@/components/feedback/AppToast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
  useOptionalToast: () => ({ showToast: mockShowToast }),
}));
jest.mock('@/store/auth-store', () => ({
  useAuthStore: (select: (state: { user: { id: string } }) => unknown) =>
    select({ user: { id: 'u1' } }),
}));
jest.mock('@/store/space-store', () => ({
  useSpaceStore: { getState: () => ({ setSelectedSpaceId: jest.fn() }) },
}));
jest.mock('@/features/items/hooks', () => ({
  useItem: () => ({
    data: {
      id: 'item-1',
      list_id: 'list-1',
      space_id: 'space-1',
      title: 'Kadıköy Kahve',
      description: 'Cumartesi sabahı deneyelim',
      original_url: 'https://example.com/coffee',
      created_by: 'u1',
      created_by_name: 'İpek',
      status: 'open',
      created_at: '2026-11-26T10:00:00Z',
    },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
  useCompleteItem: () => ({ mutate: mockComplete, isPending: false }),
  useRestoreItem: () => ({ mutate: jest.fn(), isPending: false }),
  useDeleteItem: () => ({ mutate: jest.fn(), isPending: false }),
  useMoveItem: () => ({ mutate: jest.fn(), isPending: false }),
  useUpdateItem: () => ({ mutate: mockUpdateItem, isPending: false }),
}));
jest.mock('@/features/lists/hooks', () => ({
  useLists: () => ({
    data: {
      data: [
        { id: 'list-1', name: 'Mekanlar' },
        { id: 'list-2', name: 'Hafta Sonu' },
      ],
    },
  }),
}));
jest.mock('@/features/collaboration/hooks', () => ({
  useItemComments: () => ({
    data: {
      data: [
        {
          id: 'c1',
          item_id: 'item-1',
          user_id: 'u1',
          body: 'Kahveleri harika!',
          created_at: '2026-11-26T10:05:00Z',
          updated_at: '2026-11-26T10:05:00Z',
        },
      ],
    },
    isLoading: false,
  }),
  useCreateComment: () => ({ mutate: mockCreateComment, isPending: false }),
  useUpdateComment: () => ({ mutate: jest.fn(), isPending: false }),
  useDeleteComment: () => ({ mutate: jest.fn(), isPending: false }),
  useSpaceMembers: () => ({
    data: {
      data: [{ id: 'm1', user_id: 'u1', display_name: 'İpek', role: 'owner' }],
    },
  }),
  useNotifications: () => ({
    data: {
      data: [
        {
          id: 'n1',
          title: 'Yeni kayıt eklendi',
          body: 'Can bir mekan paylaştı.',
          read_at: null,
          data: {},
        },
      ],
    },
    isLoading: false,
  }),
}));
jest.mock('@/features/collaboration/api', () => ({
  collaborationApi: {
    readAllNotifications: jest.fn().mockResolvedValue(undefined),
    readNotification: jest.fn().mockResolvedValue(undefined),
  },
}));
jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

function withQuery(child: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return render(<QueryClientProvider client={client}>{child}</QueryClientProvider>);
}

describe('Step 5 screens (ItemDetail & Notifications)', () => {
  beforeAll(() => {
    notifyManager.setNotifyFunction((callback) => {
      act(() => callback());
    });
  });

  afterAll(() => {
    notifyManager.setNotifyFunction((callback) => callback());
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await i18n.changeLanguage('tr');
  });

  it('renders ItemDetailScreen actions and triggers completion, comments & move sheet', () => {
    const ui = withQuery(<ItemDetailScreen />);

    expect(ui.getByText('Kadıköy Kahve')).toBeTruthy();
    expect(ui.getByText('Cumartesi sabahı deneyelim')).toBeTruthy();
    expect(ui.getByText('Kahveleri harika!')).toBeTruthy();

    fireEvent.changeText(ui.getByPlaceholderText('Bir not bırak…'), 'Saat 10 da');
    fireEvent.press(ui.getByRole('button', { name: 'Gönder' }));
    expect(mockCreateComment).toHaveBeenCalledWith('Saat 10 da', expect.any(Object));

    fireEvent.press(ui.getByRole('button', { name: 'Yapıldı olarak işaretle' }));
    expect(mockComplete).toHaveBeenCalled();

    fireEvent.press(ui.getByText('Başka listeye taşı'));
    expect(ui.getByText('Hafta Sonu')).toBeTruthy();

    fireEvent.press(ui.getByRole('button', { name: 'Geri git' }));
    expect(router.back).toHaveBeenCalled();
  });

  it('renders NotificationsScreen unread badge action and mark-all pill', () => {
    const ui = withQuery(<NotificationsScreen />);

    expect(ui.getByText('Yeni kayıt eklendi')).toBeTruthy();
    fireEvent.press(ui.getByRole('button', { name: 'Tümünü okundu yap' }));
    expect(collaborationApi.readAllNotifications).toHaveBeenCalled();
  });
});
