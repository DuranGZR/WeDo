import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from './AppText';
import { t } from '@/i18n';
import { type LanguagePreference } from '@/i18n/locale';
import { useLanguageStore } from '@/store/language-store';
const options: LanguagePreference[] = ['system', 'tr', 'en'];
export function LanguagePicker() {
  useTranslation();
  const { preference, hydrated, setPreference } = useLanguageStore();
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  async function select(value: LanguagePreference) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(false);
    try {
      await setPreference(value);
    } catch {
      setError(true);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <View style={styles.container}>
      <AppText style={styles.label}>{t('language.label')}</AppText>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={t('language.label')}
        style={styles.options}
      >
        {options.map((value) => (
          <Pressable
            key={value}
            accessibilityRole="radio"
            accessibilityState={{
              checked: value === preference,
              disabled: busy || !hydrated,
            }}
            disabled={busy || !hydrated}
            onPress={() => void select(value)}
            style={[styles.option, value === preference && styles.selected]}
          >
            <AppText style={value === preference ? styles.selectedText : undefined}>
              {value === 'system'
                ? t('language.system')
                : value === 'tr'
                  ? 'Türkçe'
                  : 'English'}
            </AppText>
          </Pressable>
        ))}
      </View>
      {error ? (
        <AppText accessibilityRole="alert">{t('language.saveFailed')}</AppText>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: 10, paddingVertical: 12 },
  label: { fontWeight: '600' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8D8D8B',
    backgroundColor: '#FFFFFF',
  },
  selected: { backgroundColor: '#090909', borderColor: '#090909' },
  selectedText: { color: '#FFFFFF' },
});
