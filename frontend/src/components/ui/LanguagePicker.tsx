import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SpringPressable } from '@/components/motion/SpringPressable';
import { colors, radius, shadows } from '@/design-system';
import { t } from '@/i18n';
import { type LanguagePreference } from '@/i18n/locale';
import { useLanguageStore } from '@/store/language-store';
import { AppText } from './AppText';

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
          <SpringPressable
            key={value}
            accessibilityRole="radio"
            accessibilityState={{
              checked: value === preference,
              disabled: busy || !hydrated,
            }}
            disabled={busy || !hydrated}
            pressScale={0.95}
            haptic="selection"
            onPress={() => void select(value)}
            style={[styles.option, value === preference && styles.selected]}
          >
            <AppText
              style={value === preference ? styles.selectedText : styles.optionText}
            >
              {value === 'system'
                ? t('language.system')
                : value === 'tr'
                  ? 'Türkçe'
                  : 'English'}
            </AppText>
          </SpringPressable>
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
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceCard,
  },
  selected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    ...shadows.glass,
  },
  optionText: { color: colors.primaryText, fontWeight: '500' },
  selectedText: { color: colors.onAccent, fontWeight: '600' },
});
