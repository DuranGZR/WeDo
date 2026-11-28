import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import * as Calendar from 'expo-calendar';
import { Alert, Linking } from 'react-native';

import { buildQrSvgPath } from '@/components/invite/InviteQrSheet';
import { ItemCard } from '@/components/domain/ItemCard';
import { ToastProvider } from '@/components/feedback/AppToast';
import type { Item } from '@/features/items/types';
import {
  formatListIcon,
  getListAppearance,
  parseListIcon,
} from '@/features/lists/appearance';
import { decodePlanNote, encodePlanNote } from '@/features/plans/note-meta';
import { PlanSheet } from '@/features/plans/PlanSheet';
import { UpcomingPlansSection } from '@/features/plans/UpcomingPlansSection';
import { formatPlanDateLabel, i18n } from '@/i18n';
import {
  addPlanToDeviceCalendar,
  buildGoogleCalendarUrl,
  isMapUrl,
  isPlaceLikeItem,
  openInAppleMaps,
  openInGoogleCalendar,
  openInGoogleMaps,
} from '@/lib/external-apps';

const mockPlanActionMutate = jest.fn();
const mockUpdatePlanMutateAsync = jest.fn().mockResolvedValue({ item_id: 'item-1' });
let mockPlansList = [
  {
    id: 'plan-1',
    space_id: 'space-1',
    item_id: 'item-1',
    scheduled_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    timezone: 'Europe/Istanbul',
    note: null as string | null,
    reminder_minutes_before: 60,
    status: 'approved',
    created_by: 'u2',
    created_at: '2026-11-26T10:00:00Z',
    updated_at: '2026-11-26T10:00:00Z',
  },
];

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
}));
jest.mock('@/store/auth-store', () => ({
  useAuthStore: (select: (s: { user: { id: string } }) => unknown) =>
    select({ user: { id: 'u1' } }),
}));
jest.mock('@/features/plans/hooks', () => ({
  useSpacePlans: () => ({
    data: {
      data: mockPlansList,
    },
  }),
  useCreatePlan: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useUpdatePlan: () => ({ mutateAsync: mockUpdatePlanMutateAsync, isPending: false }),
  usePlanAction: () => ({ mutate: mockPlanActionMutate, isPending: false }),
}));
jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

describe('Phase 3 & 4 UX utilities and components', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await i18n.changeLanguage('tr');
  });

  it('encodes and decodes plan location metadata cleanly', () => {
    const raw = encodePlanNote('Kadıköy Moda', 'Akşam 8 buluşalım');
    expect(decodePlanNote(raw)).toEqual({
      location: 'Kadıköy Moda',
      note: 'Akşam 8 buluşalım',
    });
    expect(decodePlanNote('Sadece not')).toEqual({
      location: '',
      note: 'Sadece not',
    });
  });

  it('recognizes map/place items and opens Apple Maps, Google Maps, and Calendar', async () => {
    const openSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);

    expect(isMapUrl('https://maps.google.com/?q=Moda')).toBe(true);
    expect(isMapUrl('https://maps.apple.com/?q=Moda')).toBe(true);
    expect(
      isPlaceLikeItem({
        title: 'Kadıköy Restoran & Kahve',
        original_url: 'https://instagram.com/p/123',
        source_domain: 'instagram.com',
      }),
    ).toBe(true);

    const gcalUrl = buildGoogleCalendarUrl({
      itemId: 'item-42',
      scheduledAt: '2026-12-05T19:00:00Z',
    });
    expect(gcalUrl).toContain('calendar.google.com/calendar/render');
    expect(gcalUrl).toContain('WeDo');
    expect(gcalUrl).toContain('item-42');

    await openInGoogleCalendar({
      itemId: 'item-42',
      scheduledAt: '2026-12-05T19:00:00Z',
    });
    await openInAppleMaps('Kadıköy');
    await openInGoogleMaps('Kadıköy');
    expect(openSpy).toHaveBeenCalledTimes(3);

    const calRes = await addPlanToDeviceCalendar({
      itemId: 'item-42',
      scheduledAt: '2026-12-05T19:00:00Z',
      reminderMinutesBefore: 60,
    });
    expect(calRes).toEqual({ status: 'saved', eventId: 'event-1' });
    expect(Calendar.getDefaultCalendarSync().createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'WeDo planı',
        url: expect.stringContaining('item-42'),
      }),
    );
    openSpy.mockRestore();
  });

  it('formats and parses custom list icon and warm swatch tokens under 32 chars', () => {
    const encoded = formatListIcon('airplane-outline', '#F2E3D5');
    expect(encoded.length).toBeLessThanOrEqual(32);
    expect(parseListIcon(encoded)).toEqual({
      icon: 'airplane-outline',
      backgroundColor: '#F2E3D5',
    });
    const visual = getListAppearance('Seyahat', false, encoded);
    expect(visual.icon).toBe('airplane-outline');
    expect(visual.backgroundColor).toBe('#F2E3D5');
  });

  it('generates SVG QR vector path for invite URLs', () => {
    const result = buildQrSvgPath('https://wedolist.app/invite/abc123');
    expect(result).not.toBeNull();
    expect(result?.size).toBeGreaterThan(15);
    expect(result?.path).toContain('M');
  });

  it('renders UpcomingPlansSection directly as planned with edit, cancel, and complete actions', async () => {
    const client = new QueryClient();
    const ui = render(
      <QueryClientProvider client={client}>
        <ToastProvider>
          <UpcomingPlansSection
            spaceId="space-1"
            items={[
              {
                id: 'item-1',
                space_id: 'space-1',
                list_id: 'list-1',
                title: 'Moda Sahil Kahve',
                created_by: 'u2',
                created_by_name: 'Can',
                status: 'planned',
                created_at: '2026-11-26T10:00:00Z',
              } as never,
            ]}
          />
        </ToastProvider>
      </QueryClientProvider>,
    );

    expect(ui.getByText('Yaklaşan planlar')).toBeTruthy();
    expect(ui.getByText('Moda Sahil Kahve')).toBeTruthy();
    expect(ui.getByText('Planlandı')).toBeTruthy();
    expect(ui.queryByText('Onay bekliyor')).toBeNull();
    expect(ui.queryByText('Onayla')).toBeNull();
    expect(ui.queryByText('Reddet')).toBeNull();

    fireEvent.press(ui.getByText('Tamamlandı'));
    await waitFor(() => {
      expect(mockPlanActionMutate).toHaveBeenCalledWith(
        { planId: 'plan-1', action: 'complete' },
        expect.any(Object),
      );
    });

    fireEvent.press(ui.getByRole('button', { name: 'Düzenle · Moda Sahil Kahve' }));
    await waitFor(() => {
      expect(ui.getByText('Planı düzenle')).toBeTruthy();
    });
  });

  it('shows cancel, complete, and planned status on UpcomingPlansSection and ItemCard without approval gate', async () => {
    mockPlansList = [
      {
        ...mockPlansList[0]!,
        id: 'plan-own',
        created_by: 'u1',
        status: 'approved',
      },
    ];
    const plannedItem: Item = {
      id: 'item-1',
      space_id: 'space-1',
      list_id: 'list-1',
      title: 'Moda Sahil Kahve',
      description: null,
      client_item_id: null,
      type: 'link',
      preview_image_url: null,
      original_url: null,
      canonical_url: null,
      source_domain: null,
      source_app: null,
      shared_text: null,
      metadata_status: 'ready',
      completed_at: null,
      created_by: 'u1',
      created_by_name: 'İpek',
      status: 'planned',
      created_at: '2026-11-26T10:00:00Z',
      updated_at: '2026-11-26T10:00:00Z',
    };
    const client = new QueryClient();
    const ui = render(
      <QueryClientProvider client={client}>
        <ToastProvider>
          <UpcomingPlansSection spaceId="space-1" items={[plannedItem]} />
          <ItemCard item={plannedItem} onPress={jest.fn()} />
        </ToastProvider>
      </QueryClientProvider>,
    );

    expect(ui.getByText('Tamamlandı')).toBeTruthy();
    expect(ui.getByText('İptal et')).toBeTruthy();
    expect(ui.getAllByText('Planlandı').length).toBeGreaterThanOrEqual(2);

    fireEvent.press(ui.getByText('İptal et'));
    await waitFor(() => {
      expect(mockPlanActionMutate).toHaveBeenCalledWith(
        { planId: 'plan-own', action: 'cancel' },
        expect.any(Object),
      );
    });
  });

  it('renders PlanSheet with Turkish month dates, without quick presets/location/note, and updates existing plan', async () => {
    expect(formatPlanDateLabel(new Date(2026, 10, 29))).toBe('29 Kasım 2026');
    const item: Item = {
      id: 'item-1',
      space_id: 'space-1',
      list_id: 'list-1',
      title: 'Moda Sahil Kahve',
      description: null,
      client_item_id: null,
      type: 'link',
      preview_image_url: null,
      original_url: null,
      canonical_url: null,
      source_domain: null,
      source_app: null,
      shared_text: null,
      metadata_status: 'ready',
      completed_at: null,
      created_by: 'u1',
      created_by_name: 'İpek',
      status: 'planned',
      created_at: '2026-11-26T10:00:00Z',
      updated_at: '2026-11-26T10:00:00Z',
    };
    const client = new QueryClient();
    const ui = render(
      <QueryClientProvider client={client}>
        <ToastProvider>
          <PlanSheet
            visible
            item={item}
            existingPlan={{
              id: 'plan-edit-1',
              space_id: 'space-1',
              item_id: 'item-1',
              created_by: 'u1',
              scheduled_at: new Date(2026, 10, 29, 19, 30).toISOString(),
              timezone: 'Europe/Istanbul',
              note: null,
              reminder_minutes_before: 15,
              status: 'proposed',
              created_at: '2026-11-26T10:00:00Z',
              updated_at: '2026-11-26T10:00:00Z',
            }}
            onClose={jest.fn()}
          />
        </ToastProvider>
      </QueryClientProvider>,
    );

    expect(ui.getByText('Planı düzenle')).toBeTruthy();
    expect(ui.getByText('29 Kasım 2026')).toBeTruthy();
    expect(ui.getByText('19:30')).toBeTruthy();
    expect(ui.queryByText('Bu akşam 20:00')).toBeNull();
    expect(ui.queryByText('Konum / Mekan (Harita için)')).toBeNull();
    expect(ui.queryByText('Plan notu')).toBeNull();

    fireEvent.press(ui.getByText('Kaydet'));
    await waitFor(() => {
      expect(mockUpdatePlanMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          planId: 'plan-edit-1',
        }),
      );
    });
  });

  it('opens calendar provider options alert when pressing compact Takvime ekle link on UpcomingPlansSection', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const client = new QueryClient();
    const ui = render(
      <QueryClientProvider client={client}>
        <ToastProvider>
          <UpcomingPlansSection
            spaceId="space-1"
            items={[
              {
                id: 'item-1',
                space_id: 'space-1',
                list_id: 'list-1',
                title: 'Moda Sahil Kahve',
                created_by: 'u2',
                created_by_name: 'Can',
                status: 'planned',
                created_at: '2026-11-26T10:00:00Z',
              } as never,
            ]}
          />
        </ToastProvider>
      </QueryClientProvider>,
    );

    expect(ui.queryByText('Google Takvim')).toBeNull();
    fireEvent.press(ui.getByRole('button', { name: 'Takvime ekle' }));

    expect(alertSpy).toHaveBeenCalledWith(
      'Takvime ekle',
      undefined,
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cihaz Takvimi' }),
        expect.objectContaining({ text: 'Google Takvim' }),
      ]),
    );
    alertSpy.mockRestore();
  });
});
