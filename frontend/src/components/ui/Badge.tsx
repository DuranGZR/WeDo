import { StyleSheet, View } from 'react-native';
import { mono, radius, spacing } from '@/design-system';
import { AppText } from './AppText';

export function Badge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'error';
}) {
  return (
    <View style={[styles.base, styles[tone]]}>
      <AppText
        variant="caption"
        style={[styles.text, tone === 'accent' && styles.accentText]}
      >
        {label}
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  neutral: { backgroundColor: mono.soft },
  accent: { backgroundColor: mono.ink },
  success: { backgroundColor: mono.soft },
  warning: { backgroundColor: mono.soft },
  error: { backgroundColor: '#F1D9D6' },
  text: { color: mono.ink },
  accentText: { color: mono.paper },
});
