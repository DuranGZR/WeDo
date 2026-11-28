import * as Calendar from 'expo-calendar';
import * as ExpoLinking from 'expo-linking';
import { Linking, Platform } from 'react-native';

import { t } from '@/i18n';

export type CalendarSaveResult =
  { status: 'saved'; eventId: string } | { status: 'denied' } | { status: 'unavailable' };

const MAP_URL_PATTERN =
  /(maps\.apple\.com|maps\.google\.|google\.[a-z.]+\/maps|goo\.gl\/maps|maps\.app\.goo\.gl|yandex\.[a-z.]+\/maps|waze\.com)/i;

const PLACE_KEYWORD_PATTERN =
  /(restoran|restaurant|kafe|cafe|coffee|kahve|bistro|ramen|pizza|burger|mekan|otel|hotel|müze|museum|sinema|cinema|park|sahil|plaj|bar|pub|kahvaltı|akşam yemeği|dinner|brunch|travel|tatil)/i;

export function isMapUrl(url?: string | null): boolean {
  if (!url) return false;
  return MAP_URL_PATTERN.test(url);
}

export function isPlaceLikeItem(item: {
  original_url?: string | null;
  source_domain?: string | null;
  title?: string | null;
}): boolean {
  if (isMapUrl(item.original_url)) return true;
  const domain = (item.source_domain ?? '').toLowerCase();
  if (
    domain.includes('maps') ||
    domain.includes('foursquare') ||
    domain.includes('yelp')
  ) {
    return true;
  }
  return PLACE_KEYWORD_PATTERN.test(item.title ?? '');
}

export function buildLocationQuery(options: {
  location?: string | null;
  title?: string | null;
  originalUrl?: string | null;
}): string {
  const cleanLocation = options.location?.trim();
  if (cleanLocation) return cleanLocation;

  if (options.originalUrl && isMapUrl(options.originalUrl)) {
    try {
      const parsed = new URL(options.originalUrl);
      const q =
        parsed.searchParams.get('q') ??
        parsed.searchParams.get('query') ??
        parsed.searchParams.get('ll');
      if (q?.trim()) return q.trim();
    } catch {
      // Fallback to title if URL parsing fails
    }
  }

  return options.title?.trim() || '';
}

export async function openInAppleMaps(
  query: string,
  rawUrl?: string | null,
): Promise<boolean> {
  try {
    if (rawUrl && /maps\.apple\.com/i.test(rawUrl)) {
      await Linking.openURL(rawUrl);
      return true;
    }
    const encoded = encodeURIComponent(query.trim());
    if (!encoded) return false;
    const webUrl = `https://maps.apple.com/?q=${encoded}`;
    if (Platform.OS === 'ios') {
      const nativeUrl = 'maps://?q=' + encoded;
      const supported = await Linking.canOpenURL(nativeUrl).catch(() => false);
      await Linking.openURL(supported ? nativeUrl : webUrl);
      return true;
    }
    await Linking.openURL(webUrl);
    return true;
  } catch {
    return false;
  }
}

export async function openInGoogleMaps(
  query: string,
  rawUrl?: string | null,
): Promise<boolean> {
  try {
    if (
      rawUrl &&
      /(maps\.google\.|google\.[a-z.]+\/maps|goo\.gl\/maps|maps\.app\.goo\.gl)/i.test(
        rawUrl,
      )
    ) {
      await Linking.openURL(rawUrl);
      return true;
    }
    const encoded = encodeURIComponent(query.trim());
    if (!encoded) return false;
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
    if (Platform.OS === 'ios') {
      const nativeUrl = 'comgooglemaps://?q=' + encoded;
      const supported = await Linking.canOpenURL(nativeUrl).catch(() => false);
      await Linking.openURL(supported ? nativeUrl : webUrl);
      return true;
    }
    await Linking.openURL(webUrl);
    return true;
  } catch {
    return false;
  }
}

function formatGoogleCalendarUtc(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

export function getWeDoCalendarTitle(): string {
  return t('plans.calendarEventTitle');
}

export function buildWeDoItemDeepLink(itemId: string): string {
  const path = '/item/' + itemId;
  try {
    if (typeof ExpoLinking.createURL === 'function') {
      return ExpoLinking.createURL(path);
    }
  } catch {
    // Fallback to static scheme URI in environments without a Linking prefix
  }
  return 'wedo://item/' + itemId;
}

export function buildGoogleCalendarUrl(input: {
  title?: string;
  itemId?: string;
  scheduledAt: Date | string;
  notes?: string | null;
  location?: string | null;
}): string {
  const start =
    input.scheduledAt instanceof Date ? input.scheduledAt : new Date(input.scheduledAt);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const itemUrl = input.itemId ? buildWeDoItemDeepLink(input.itemId) : undefined;
  const resolvedNotes = itemUrl
    ? t('plans.calendarOpenInAppHint', { url: itemUrl })
    : input.notes?.trim() || undefined;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: input.title ?? getWeDoCalendarTitle(),
    dates: `${formatGoogleCalendarUtc(start)}/${formatGoogleCalendarUtc(end)}`,
  });
  if (resolvedNotes) params.set('details', resolvedNotes);
  if (input.location?.trim()) params.set('location', input.location.trim());
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export async function openInGoogleCalendar(input: {
  title?: string;
  itemId?: string;
  scheduledAt: Date | string;
  notes?: string | null;
  location?: string | null;
}): Promise<boolean> {
  try {
    await Linking.openURL(buildGoogleCalendarUrl(input));
    return true;
  } catch {
    return false;
  }
}

export async function addPlanToDeviceCalendar(input: {
  title?: string;
  itemId?: string;
  scheduledAt: Date | string;
  notes?: string | null;
  location?: string | null;
  reminderMinutesBefore?: number | null;
}): Promise<CalendarSaveResult> {
  if (Platform.OS === 'web') return { status: 'unavailable' };
  try {
    const permission = await Calendar.requestCalendarPermissions(true);
    if (permission.status !== 'granted') return { status: 'denied' };

    let targetCalendar: Calendar.ExpoCalendar | undefined;
    if (Platform.OS === 'ios') {
      try {
        const defaultCal = Calendar.getDefaultCalendarSync();
        if (defaultCal?.allowsModifications) targetCalendar = defaultCal;
      } catch {
        // Fallback to scanning writable calendars below
      }
    }

    if (!targetCalendar) {
      const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
      const writable = calendars.filter((cal) => cal.allowsModifications);
      targetCalendar =
        writable.find((cal) => cal.isPrimary) ??
        writable.find((cal) => cal.source?.name === 'iCloud') ??
        writable[0];
    }

    if (!targetCalendar) return { status: 'unavailable' };

    const startDate =
      input.scheduledAt instanceof Date ? input.scheduledAt : new Date(input.scheduledAt);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    const itemUrl = input.itemId ? buildWeDoItemDeepLink(input.itemId) : undefined;
    const resolvedNotes = itemUrl
      ? t('plans.calendarOpenInAppHint', { url: itemUrl })
      : input.notes?.trim() || undefined;

    const created = await targetCalendar.createEvent({
      title: input.title ?? getWeDoCalendarTitle(),
      startDate,
      endDate,
      url: itemUrl,
      notes: resolvedNotes,
      location: input.location?.trim() || undefined,
      alarms:
        input.reminderMinutesBefore && input.reminderMinutesBefore >= 5
          ? [{ relativeOffset: -input.reminderMinutesBefore }]
          : undefined,
    });
    return { status: 'saved', eventId: created.id };
  } catch {
    return { status: 'unavailable' };
  }
}
