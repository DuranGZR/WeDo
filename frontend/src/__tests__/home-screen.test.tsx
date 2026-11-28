import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import HomeScreen from '@/app/(tabs)/index';
import { itemsApi } from '@/features/items/api';
import { i18n } from '@/i18n';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@/store/auth-store', () => ({
  useAuthStore: (
    select: (state: { user: { id: string; display_name: string } }) => unknown,
  ) => select({ user: { id: 'u1', display_name: 'İpek' } }),
}));
jest.mock('@/store/space-store', () => ({
  useSpaceStore: (
    select: (state: {
      selectedSpaceId: string;
      setSelectedSpaceId: () => void;
    }) => unknown,
  ) => select({ selectedSpaceId: 'space-1', setSelectedSpaceId: jest.fn() }),
}));
jest.mock('@/features/spaces/hooks', () => ({
  useSpaces: () => ({
    data: { data: [{ id: 'space-1', name: 'Bizim Alan', type: 'couple' }] },
    isSuccess: true,
    isLoading: false,
  }),
}));
jest.mock('@/features/collaboration/hooks', () => ({
  useSpaceMembers: () => ({
    data: {
      data: [
        { id: 'm1', user_id: 'u1', display_name: 'İpek', role: 'owner' },
        { id: 'm2', user_id: 'u2', display_name: 'Can', role: 'member' },
      ],
    },
    isSuccess: true,
  }),
}));
const mockLists = jest.fn(() => ({ data: { data: [] as unknown[] }, isLoading: false }));
jest.mock('@/features/lists/hooks', () => ({
  useLists: () => mockLists(),
  useCreateList: () => ({ mutate: jest.fn() }),
}));
jest.mock('@/features/items/api', () => ({ itemsApi: { list: jest.fn() } }));
jest.mock('@/components/motion/ScreenMotion', () => ({
  ScreenMotion: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@/components/feedback/AppToast', () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));
jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

describe('HomeScreen Liquid Glass refresh', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockLists.mockReturnValue({ data: { data: [] }, isLoading: false });
    jest
      .mocked(itemsApi.list)
      .mockResolvedValue({ data: [], next_cursor: null } as never);
    await i18n.changeLanguage('tr');
  });

  it('replaces header profile avatar with Notifications and Add Item actions and keeps editorial greeting', () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    const ui = render(
      <QueryClientProvider client={client}>
        <HomeScreen />
      </QueryClientProvider>,
    );

    expect(ui.queryByRole('button', { name: 'Profil' })).toBeNull();
    fireEvent.press(ui.getByRole('button', { name: 'Bildirimler' }));
    expect(router.push).toHaveBeenCalledWith('/notifications');

    fireEvent.press(ui.getByRole('button', { name: 'İçerik Ekle' }));
    expect(router.push).toHaveBeenCalledWith('/item/create');

    expect(ui.getByText(/Merhaba,/)).toBeTruthy();
    expect(ui.getByText('planlıyoruz?')).toBeTruthy();
  });

  it('routes from the empty-state bronze hero actions', () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    const ui = render(
      <QueryClientProvider client={client}>
        <HomeScreen />
      </QueryClientProvider>,
    );

    fireEvent.press(ui.getByRole('button', { name: 'Nasıl kaydedilir' }));
    expect(router.push).toHaveBeenCalledWith('/(onboarding)/share-tutorial');

    fireEvent.press(ui.getByRole('button', { name: 'Bağlantıyı elle ekle' }));
    expect(router.push).toHaveBeenCalledWith('/item/create');
  });

  it('renders recently added cards and floating shared list cards when populated', async () => {
    mockLists.mockReturnValue({
      data: {
        data: [
          { id: 'list-1', space_id: 'space-1', name: 'İzlenecekler' },
          { id: 'list-2', space_id: 'space-1', name: 'Gidilecek Yerler' },
        ],
      },
      isLoading: false,
    });
    jest.mocked(itemsApi.list).mockImplementation(
      async (listId: string) =>
        ({
          data:
            listId === 'list-1'
              ? [
                  {
                    id: 'item-1',
                    space_id: 'space-1',
                    list_id: 'list-1',
                    created_by: 'u1',
                    created_by_name: 'İpek',
                    client_item_id: null,
                    type: 'video',
                    status: 'open',
                    title: 'Nomo Ramen',
                    description: null,
                    preview_image_url: null,
                    original_url: 'https://instagram.com/reel/1',
                    canonical_url: 'https://instagram.com/reel/1',
                    source_domain: 'instagram.com',
                    source_app: 'Instagram',
                    shared_text: null,
                    metadata_status: 'ready',
                    completed_at: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                ]
              : [],
          next_cursor: null,
        }) as never,
    );

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    const ui = render(
      <QueryClientProvider client={client}>
        <HomeScreen />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(ui.getByText('Son eklenenler')).toBeTruthy();
      expect(ui.getByText('Nomo Ramen')).toBeTruthy();
    });
    expect(ui.getByText('Ortak listeler')).toBeTruthy();
    expect(ui.getByText('İzlenecekler')).toBeTruthy();
    expect(ui.getByText('Gidilecek Yerler')).toBeTruthy();

    fireEvent.press(ui.getByText('Nomo Ramen'));
    expect(router.push).toHaveBeenCalledWith('/item/item-1');

    fireEvent.press(ui.getByText('Gidilecek Yerler'));
    expect(router.push).toHaveBeenCalledWith('/list/list-2');
  });
});
