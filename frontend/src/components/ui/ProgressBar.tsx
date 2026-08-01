import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/design-system';

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const progress = Math.max(0, Math.min(1, value));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 1, now: progress }}
      style={styles.track}
    >
      <View style={[styles.fill, { width: `${progress * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    width: '100%',
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    marginVertical: spacing.xs,
  },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.accent },
});
