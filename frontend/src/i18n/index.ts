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
export function formatDate(value: Date | string, withTime = false): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return withTime
    ? date.toLocaleString(formatLocale())
    : date.toLocaleDateString(formatLocale());
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
