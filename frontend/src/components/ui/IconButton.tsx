import { Pressable, StyleSheet } from 'react-native';

import { colors, radius } from '@/design-system';

export function IconButton({
  icon,
  label,
  onPress,
  tone = 'neutral',
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  tone?: 'neutral' | 'accent';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        tone === 'accent' && styles.accent,
        pressed && styles.pressed,
      ]}
    >
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryText,
  },
  accent: { backgroundColor: colors.accentSoft },
  pressed: { transform: [{ scale: 0.96 }], opacity: 0.8 },
});
