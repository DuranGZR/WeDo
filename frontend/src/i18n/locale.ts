export type Language = 'tr' | 'en';
export type LanguagePreference = 'system' | Language;
export function resolveLanguage(
  preference: LanguagePreference,
  languages: readonly string[],
): Language {
  if (preference !== 'system') return preference;
  for (const locale of languages) {
    const language = locale.toLowerCase().split(/[-_]/)[0];
    if (language === 'tr' || language === 'en') return language;
  }
  return 'en';
}
export function validPreference(value: unknown): LanguagePreference {
  return value === 'tr' || value === 'en' ? value : 'system';
}
