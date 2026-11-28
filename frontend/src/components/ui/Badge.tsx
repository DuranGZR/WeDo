import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/design-system';
import { AppText } from './AppText';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'error' | 'glass';

const BADGE_STYLES: Record<BadgeTone, { bg: string; text: string }> = {
  neutral: { bg: colors.accentSoft, text: colors.primaryText },
  accent: { bg: colors.accent, text: colors.onAccent },
  success: { bg: colors.successSoft, text: colors.success },
  warning: { bg: colors.warningSoft, text: colors.warning },
  error: { bg: colors.errorSoft, text: colors.error },
  glass: { bg: colors.glassDark, text: colors.onAccent },
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  const palette = BADGE_STYLES[tone];

  return (
    <View style={[styles.base, { backgroundColor: palette.bg }]}>
      <AppText variant="caption" style={[styles.text, { color: palette.text }]}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  text: {
    fontWeight: '600',
  },
});
