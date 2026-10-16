import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { create } from 'zustand';
import { i18n, currentLanguage } from '@/i18n';
import {
  resolveLanguage,
  validPreference,
  type Language,
  type LanguagePreference,
} from '@/i18n/locale';
const STORAGE_KEY = 'wedo.language-preference';
let hydration: Promise<void> | null = null;
let writes = Promise.resolve();
const resolve = (preference: LanguagePreference) =>
  resolveLanguage(
    preference,
    getLocales().map((locale) => locale.languageTag),
  );
export const useLanguageStore = create<{
  preference: LanguagePreference;
  language: Language;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setPreference: (preference: LanguagePreference) => Promise<void>;
  refreshSystemLanguage: () => Promise<void>;
}>((set, get) => ({
  preference: 'system',
  language: currentLanguage(),
  hydrated: false,
  hydrate() {
    if (!hydration)
      hydration = (async () => {
        let saved: string | null = null;
        try {
          saved = await AsyncStorage.getItem(STORAGE_KEY);
        } catch {
          /* Device preference. */
        }
        const preference = validPreference(saved);
        const language = resolve(preference);
        await i18n.changeLanguage(language);
        set({ preference, language, hydrated: true });
      })();
    return hydration;
  },
  async setPreference(preference) {
    const next = validPreference(preference);
    const operation = writes
      .catch(() => {})
      .then(async () => {
        await AsyncStorage.setItem(STORAGE_KEY, next);
        const language = resolve(next);
        await i18n.changeLanguage(language);
        set({ preference: next, language });
      });
    writes = operation;
    await operation;
  },
  async refreshSystemLanguage() {
    if (!get().hydrated || get().preference !== 'system') return;
    const language = resolve('system');
    if (language !== get().language) {
      await i18n.changeLanguage(language);
      set({ language });
    }
  },
}));
