import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import en from './resources/en.json';
import tr from './resources/tr.json';
import { resolveLanguage, type Language } from './locale';
export const i18n = createInstance();
void i18n.use(initReactI18next).init({
  resources: { tr: { translation: tr }, en: { translation: en } },
  lng: resolveLanguage(
    'system',
    getLocales().map((locale) => locale.languageTag),
  ),
  fallbackLng: 'en',
  supportedLngs: ['tr', 'en'],
  keySeparator: false,
  interpolation: { escapeValue: false },
  initAsync: false,
  react: { useSuspense: false },
});
type CatalogKey = keyof typeof tr;
type PluralKey = CatalogKey extends infer Key
  ? Key extends `${infer Base}_one` | `${infer Base}_other`
    ? Base
    : never
  : never;
export type TranslationKey = CatalogKey | PluralKey;
export function t(key: TranslationKey, values?: Record<string, unknown>): string {
  return String(i18n.t(key, values));
}
export function currentLanguage(): Language {
  return i18n.resolvedLanguage === 'tr' ? 'tr' : 'en';
}
export function formatLocale(): string {
  if (currentLanguage() === 'tr') return 'tr-TR';
  return (
    getLocales().find((locale) => locale.languageCode === 'en')?.languageTag ?? 'en-GB'
  );
}
const TURKISH_MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
] as const;

const TURKISH_WEEKDAYS = [
  'Pazar',
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi',
] as const;

const ENGLISH_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const ENGLISH_WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const TURKISH_MONTHS_SHORT = [
  'OCA',
  'ŞUB',
  'MAR',
  'NİS',
  'MAY',
  'HAZ',
  'TEM',
  'AĞU',
  'EYL',
  'EKİ',
  'KAS',
  'ARA',
] as const;

const ENGLISH_MONTHS_SHORT = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
] as const;

export function formatPlanCalendarBadge(value: Date | string): {
  day: string;
  monthShort: string;
} {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return { day: '—', monthShort: '' };
  const monthsShort =
    currentLanguage() === 'tr' ? TURKISH_MONTHS_SHORT : ENGLISH_MONTHS_SHORT;
  return {
    day: String(date.getDate()),
    monthShort: monthsShort[date.getMonth()] ?? '',
  };
}

export function formatPlanShortDateTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const months = currentLanguage() === 'tr' ? TURKISH_MONTHS : ENGLISH_MONTHS;
  const month = months[date.getMonth()] ?? '';
  return `${date.getDate()} ${month} ${formatPlanWeekdayLabel(date)} · ${formatPlanTimeLabel(date)}`;
}

export function formatChatDayDivider(value: Date | string, now = new Date()): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) return t('items.chatToday');
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();
  if (isYesterday) return t('items.chatYesterday');
  return formatPlanDateLabel(date);
}

export function formatPlanDateLabel(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const months = currentLanguage() === 'tr' ? TURKISH_MONTHS : ENGLISH_MONTHS;
  const day = date.getDate();
  const month = months[date.getMonth()] ?? '';
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatPlanWeekdayLabel(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const weekdays = currentLanguage() === 'tr' ? TURKISH_WEEKDAYS : ENGLISH_WEEKDAYS;
  return weekdays[date.getDay()] ?? '';
}

export function formatPlanTimeLabel(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatPlanDateTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${formatPlanDateLabel(date)} (${formatPlanWeekdayLabel(date)}) · ${formatPlanTimeLabel(date)}`;
}

export function formatDate(value: Date | string, withTime = false): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  if (withTime) {
    return `${formatPlanDateLabel(date)} · ${formatPlanTimeLabel(date)}`;
  }
  return date.toLocaleDateString(formatLocale());
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(formatLocale()).format(value);
}

export function searchText(value: string, locale = formatLocale()): string {
  // English lowercasing of Turkish İ includes a combining dot. Ignore that dot
  // for matching while preserving Turkish I/ı and İ/i casing rules.
  return value
    .normalize('NFC')
    .toLocaleLowerCase(locale)
    .replace(/\u0307/g, '');
}

export function formatRelativeTime(value: string, now = Date.now()): string {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return '—';
  const minutes = Math.max(0, Math.floor((now - timestamp) / 60_000));
  if (minutes < 1) return t('home.now');
  if (minutes < 60) return t('common.minutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('common.hoursAgo', { count: hours });
  return t('common.daysAgo', { count: Math.floor(hours / 24) });
}
