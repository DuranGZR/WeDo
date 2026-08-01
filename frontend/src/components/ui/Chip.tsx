import { Pressable, StyleSheet } from 'react-native';

import { colors, radius, spacing } from '@/design-system';
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
      <Pressable
        accessibilityRole="text"
        style={[styles.base, selected && styles.selected]}
      >
        {content}
      </Pressable>
    );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 36,
    borderRadius: radius.pill,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selected: { backgroundColor: colors.accent, borderColor: colors.accent },
  label: { color: colors.secondaryText },
  selectedLabel: { color: colors.surface, fontWeight: '700' },
  pressed: { opacity: 0.75 },
});
