import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { TextInput, View } from 'react-native';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import {
  i18n,
  t,
  formatDate,
  formatNumber,
  formatRelativeTime,
  searchText,
} from '@/i18n';
import { getLocales } from 'expo-localization';
import { resolveLanguage, validPreference } from '@/i18n/locale';
import { useLanguageStore } from '@/store/language-store';
import { LanguagePicker } from '@/components/ui/LanguagePicker';
import { useSignInForm } from '@/features/auth/forms';
import { signInSchema } from '@/features/auth/schemas';
import { apiClient } from '@/api/client/api-client';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@/lib/env', () => ({ env: { apiUrl: 'https://example.test' } }));

beforeEach(async () => {
  jest.clearAllMocks();
  await i18n.changeLanguage('tr');
  useLanguageStore.setState({ language: 'tr', preference: 'system', hydrated: true });
  jest
    .mocked(getLocales)
    .mockReturnValue([{ ...getLocales()[0], languageTag: 'tr-TR', languageCode: 'tr' }]);
});

it('hydrates a saved preference and follows the device only in system mode', async () => {
  jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce('en');
  useLanguageStore.setState({ hydrated: false });
  await useLanguageStore.getState().hydrate();
  expect(useLanguageStore.getState().language).toBe('en');
  await useLanguageStore.getState().refreshSystemLanguage();
  expect(useLanguageStore.getState().language).toBe('en');
  await useLanguageStore.getState().setPreference('system');
  expect(useLanguageStore.getState().language).toBe('tr');
  jest
    .mocked(getLocales)
    .mockReturnValue([{ ...getLocales()[0], languageTag: 'en-US', languageCode: 'en' }]);
  await useLanguageStore.getState().refreshSystemLanguage();
  expect(useLanguageStore.getState().language).toBe('en');
});

it('preserves Turkish casing and matches Turkish names in English search', () => {
  expect(searchText('I İ ı i', 'tr-TR')).toBe('ı i ı i');
  expect(searchText('İstanbul', 'en-US')).toBe('istanbul');
});

it('chooses the first supported device language with a safe English fallback', () => {
  expect(resolveLanguage('system', ['de-DE', 'en-US', 'tr-TR'])).toBe('en');
  expect(resolveLanguage('system', ['tr-CY', 'en-US'])).toBe('tr');
  expect(resolveLanguage('system', ['de-DE'])).toBe('en');
  expect(resolveLanguage('tr', ['en-US'])).toBe('tr');
  expect(resolveLanguage('en', ['tr-TR'])).toBe('en');
  expect(validPreference('broken')).toBe('system');
});

it('translates validation, plural forms, dates and numbers', async () => {
  const values = { email: 'invalid', password: 'x' };
  expect(signInSchema.safeParse(values).error?.issues[0]?.message).toBe(
    t('auth.enterAValidEmailAddress'),
  );
  expect(formatNumber(1234.5)).toBe('1.234,5');
  const trDate = formatDate(new Date(2026, 9, 15));
  await i18n.changeLanguage('en');
  expect(signInSchema.safeParse(values).error?.issues[0]?.message).toBe(
    'Enter a valid email address.',
  );
  expect(t('common.itemCount', { count: 1 })).toBe('1 item');
  expect(t('common.itemCount', { count: 2 })).toBe('2 items');
  expect(t('spaces.memberCount', { count: 1 })).toBe('1 member');
  expect(t('spaces.memberCount', { count: 2 })).toBe('2 members');
  expect(t('auth.resendCountdown', { count: 1 })).toContain('1 second.');
  expect(t('auth.resendCountdown', { count: 2 })).toContain('2 seconds.');
  expect(formatNumber(1234.5)).toBe('1,234.5');
  expect(formatDate(new Date(2026, 9, 15))).not.toBe(trDate);
  expect(
    formatRelativeTime('2026-10-15T10:00:00Z', Date.parse('2026-10-15T10:12:00Z')),
  ).toBe('12m ago');
  expect(formatDate('invalid')).toBe('—');
});

it('localizes network failures instead of displaying browser errors', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));
  try {
    await i18n.changeLanguage('en');
    await expect(apiClient('/items')).rejects.toThrow(t('common.networkError'));
    await i18n.changeLanguage('tr');
    await expect(apiClient('/items')).rejects.toThrow(t('common.networkError'));
    const controller = new AbortController();
    controller.abort();
    await expect(apiClient('/items', { signal: controller.signal })).rejects.toThrow(
      'Failed to fetch',
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

function Form() {
  useTranslation();
  const form = useSignInForm();
  return (
    <View>
      <Controller
        control={form.control}
        name="email"
        render={({ field }) => (
          <TextInput
            accessibilityLabel={t('auth.email')}
            value={field.value}
            onChangeText={field.onChange}
          />
        )}
      />
      <LanguagePicker />
    </View>
  );
}

it('switches immediately without losing form data and persists the choice', async () => {
  const screen = render(<Form />);
  fireEvent.changeText(screen.getByLabelText('E-posta'), 'kullanici@example.com');
  fireEvent.press(screen.getByRole('radio', { name: 'English' }));
  await waitFor(() =>
    expect(screen.getByLabelText('Email').props.value).toBe('kullanici@example.com'),
  );
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('wedo.language-preference', 'en');
  expect(useLanguageStore.getState().language).toBe('en');
});

it('keeps the active language when saving a preference fails', async () => {
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('Storage failed'));
  const screen = render(<LanguagePicker />);
  fireEvent.press(screen.getByRole('radio', { name: 'English' }));
  await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
  expect(i18n.resolvedLanguage).toBe('tr');
});

it('sends the selected language in API requests without translating user content', async () => {
  const originalFetch = globalThis.fetch;
  const fetchMock = jest
    .fn()
    .mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
  globalThis.fetch = fetchMock;
  try {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    await apiClient('/items', { method: 'POST', body: { title: 'İstanbul planı' } });
    expect(fetchMock.mock.calls[0][1].headers['Accept-Language']).toBe('en');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).title).toBe('İstanbul planı');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
