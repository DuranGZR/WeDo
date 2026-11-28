import { t, formatLocale } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/design-system';
import { AppText } from './AppText';

export function Avatar({ name, size = 44 }: { name?: string | null; size?: number }) {
  useTranslation();
  return (
    <View
      accessible
      accessibilityLabel={t('home.avatarForValue', { value0: name ?? t('common.user') })}
      style={[styles.base, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <AppText
        style={[styles.text, { fontSize: size * 0.4, lineHeight: Math.ceil(size * 0.5) }]}
      >
        {name?.trim().charAt(0).toLocaleUpperCase(formatLocale()) ?? 'W'}
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  text: { color: colors.onAccent, fontWeight: '700', textAlign: 'center' },
});
