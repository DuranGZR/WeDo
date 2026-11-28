import { StyleSheet, View } from 'react-native';

import { SpringPressable } from '@/components/motion/SpringPressable';
import { colors, radius, shadows, spacing } from '@/design-system';
import { AppText } from './AppText';

export function Chip({
  label,
  selected = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const content = (
    <AppText variant="caption" style={[styles.label, selected && styles.selectedLabel]}>
      {label}
    </AppText>
  );
  if (!onPress)
    return (
      <View accessibilityRole="text" style={[styles.base, selected && styles.selected]}>
        {content}
      </View>
    );
  return (
    <SpringPressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      pressScale={0.95}
      pressOpacity={0.86}
      haptic="selection"
      onPress={onPress}
      style={[styles.base, selected && styles.selected]}
    >
      {content}
    </SpringPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 36,
    borderRadius: radius.pill,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    ...shadows.glass,
  },
  label: {
    color: colors.secondaryText,
    fontWeight: '600',
  },
  selectedLabel: {
    color: colors.onAccent,
    fontWeight: '700',
  },
});
