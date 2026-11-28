import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import ListsScreen from '@/app/(tabs)/lists/index';
import ListDetailScreen from '@/app/list/[listId]/index';
import { ToastProvider } from '@/components/feedback/AppToast';
import { itemsApi } from '@/features/items/api';
import { i18n } from '@/i18n';

jest.mock('expo-router', () => {
  const React = jest.requireActual('react');
  return {
    router: {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      canGoBack: () => true,
    },
    useLocalSearchParams: () => ({ listId: 'list-1' }),
    useFocusEffect: (effect: () => void) => {
      React.useEffect(() => effect(), [effect]);
    },
  };
});
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
jest.mock('@/features/plans/hooks', () => ({
  useSpacePlans: () => ({
    data: {
      data: [
        {
          id: 'plan-100',
          space_id: 'space-1',
          item_id: 'item-1',
          created_by: 'u1',
          scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          timezone: 'Europe/Istanbul',
          note: null,
          reminder_minutes_before: 60,
          status: 'approved',
          created_at: '2026-11-26T10:00:00Z',
          updated_at: '2026-11-26T10:00:00Z',
        },
      ],
    },
    dataUpdatedAt: Date.now(),
  }),
  useCreatePlan: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useUpdatePlan: () => ({ mutateAsync: jest.fn(), isPending: false }),
  usePlanAction: () => ({ mutate: jest.fn(), isPending: false }),
}));
jest.mock('@/features/lists/hooks', () => ({
  useLists: () => ({
    data: { data: [{ id: 'list-1', name: 'Mekanlar', is_default: false }] },
    isLoading: false,
  }),
  useList: () => ({
    data: { id: 'list-1', name: 'Mekanlar', is_default: false },
    isLoading: false,
    isError: false,
  }),
}));
jest.mock('@/features/items/api', () => ({
  itemsApi: {
    list: jest.fn(),
    complete: jest.fn().mockResolvedValue({}),
    restore: jest.fn().mockResolvedValue({}),
    move: jest.fn().mockResolvedValue({}),
    remove: jest.fn().mockResolvedValue({}),
  },
}));
jest.mock('@/features/items/hooks', () => ({
  metadataRefreshInterval: () => false,
  useItems: () => ({
    data: {
      data: [
        {
          id: 'item-1',
          title: 'Kadıköy Kahve',
          source_domain: 'maps.google.com',
          status: 'open',
          created_by_name: 'İpek',
          created_at: '2026-11-26T10:00:00Z',
        },
        {
          id: 'item-2',
          title: 'Boğaz Yürüyüşü',
          source_domain: 'instagram.com',
          status: 'completed',
          created_by_name: 'Can',
          created_at: '2026-11-25T10:00:00Z',
        },
      ],
    },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
}));
jest.mock('@/components/motion/ScreenMotion', () => ({
  ScreenMotion: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

function withQuery(child: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>{child}</ToastProvider>
    </QueryClientProvider>,
  );
}

describe('Lists & ListDetail Liquid Glass screens', () => {
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
    jest.mocked(itemsApi.list).mockResolvedValue({
      data: [
        {
          id: 'item-1',
          space_id: 'space-1',
          list_id: 'list-1',
          title: 'Kadıköy Kahve',
          description: null,
          client_item_id: null,
          type: 'link',
          preview_image_url: null,
          original_url: 'https://maps.google.com/?q=Kadikoy',
          canonical_url: null,
          source_domain: 'maps.google.com',
          source_app: null,
          shared_text: null,
          metadata_status: 'ready',
          completed_at: null,
          created_by: 'u1',
          created_by_name: 'İpek',
          status: 'planned',
          created_at: '2026-11-26T10:00:00Z',
          updated_at: '2026-11-26T10:00:00Z',
        },
      ],
      pagination: { page: 1, page_size: 50, has_more: false },
    });
    await i18n.changeLanguage('tr');
  });

  it('replaces header profile avatar with Notifications and New List actions on Lists tab', async () => {
    const ui = withQuery(<ListsScreen />);

    expect(ui.queryByRole('button', { name: 'Profil' })).toBeNull();
    fireEvent.press(ui.getByRole('button', { name: 'Bildirimler' }));
    expect(router.push).toHaveBeenCalledWith('/notifications');

    fireEvent.press(ui.getAllByRole('button', { name: 'Yeni liste oluştur' })[0]!);
    expect(router.push).toHaveBeenCalledWith('/list/create?spaceId=space-1');

    await waitFor(() => {
      expect(ui.getByText('Mekanlar')).toBeTruthy();
    });
  });

  it('shows Plans section inside Lists tab and opens PlanSheet to edit a scheduled plan', async () => {
    const ui = withQuery(<ListsScreen />);

    await waitFor(() => {
      expect(ui.getByRole('tab', { name: 'Planlar (1)' })).toBeTruthy();
    });
    expect(ui.queryByText(/Yaklaşan:/)).toBeNull();
    expect(ui.queryByText('Planlanan içerikler')).toBeNull();

    fireEvent.press(ui.getByRole('tab', { name: 'Planlar (1)' }));
    await waitFor(() => {
      expect(ui.getByText('Planlanan içerikler')).toBeTruthy();
      expect(ui.getByText('Kadıköy Kahve')).toBeTruthy();
      expect(ui.getByText('Planlandı')).toBeTruthy();
      expect(ui.getByText('Tamamlandı')).toBeTruthy();
      expect(ui.getByText('İptal et')).toBeTruthy();
      expect(ui.getByText('1 saat önce')).toBeTruthy();
    });

    fireEvent.press(ui.getByRole('button', { name: 'Düzenle · Kadıköy Kahve' }));
    await waitFor(() => {
      expect(ui.getByText('Planı düzenle')).toBeTruthy();
    });
  });

  it('filters ListDetail items via the glass SegmentedControl', () => {
    const ui = withQuery(<ListDetailScreen />);

    expect(ui.getByText('Kadıköy Kahve')).toBeTruthy();
    expect(ui.getByText('Boğaz Yürüyüşü')).toBeTruthy();

    fireEvent.press(ui.getByRole('tab', { name: 'Yapıldı' }));
    expect(ui.queryByText('Kadıköy Kahve')).toBeNull();
    expect(ui.getByText('Boğaz Yürüyüşü')).toBeTruthy();

    fireEvent.press(ui.getByRole('tab', { name: 'Yapılmadı' }));
    expect(ui.getByText('Kadıköy Kahve')).toBeTruthy();
    expect(ui.queryByText('Boğaz Yürüyüşü')).toBeNull();
  });

  it('toggles top-right search and switches between Grid and List views in ListDetail', () => {
    const ui = withQuery(<ListDetailScreen />);

    fireEvent.press(ui.getByRole('button', { name: 'Listede ara' }));
    fireEvent.changeText(ui.getByPlaceholderText('Listede ara...'), 'Boğaz');
    expect(ui.queryByText('Kadıköy Kahve')).toBeNull();
    expect(ui.getByText('Boğaz Yürüyüşü')).toBeTruthy();

    fireEvent.press(ui.getByRole('button', { name: 'Liste görünümü' }));
    expect(ui.getByText('Boğaz Yürüyüşü')).toBeTruthy();
    expect(
      ui.getByRole('button', { name: 'Liste görünümü' }).props.accessibilityState,
    ).toEqual({
      selected: true,
    });

    fireEvent.press(ui.getByRole('button', { name: 'Izgara görünümü' }));
    expect(
      ui.getByRole('button', { name: 'Izgara görünümü' }).props.accessibilityState,
    ).toEqual({
      selected: true,
    });

    fireEvent.press(ui.getByRole('button', { name: 'Bağlantı ekle' }));
    expect(router.push).toHaveBeenCalledWith('/item/create?listId=list-1');
  });

  it('filters by source chip and triggers swipe completion in list view', async () => {
    const ui = withQuery(<ListDetailScreen />);

    fireEvent.press(ui.getByText('Instagram'));
    expect(ui.queryByText('Kadıköy Kahve')).toBeNull();
    expect(ui.getByText('Boğaz Yürüyüşü')).toBeTruthy();

    fireEvent.press(ui.getByText('Tüm kaynaklar'));
    expect(ui.getByText('Kadıköy Kahve')).toBeTruthy();

    fireEvent.press(ui.getByRole('button', { name: 'Liste görünümü' }));
    expect(ui.getByText('Kadıköy Kahve')).toBeTruthy();
  });
});
