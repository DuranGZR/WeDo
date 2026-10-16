import {
  ActivityIndicator,
  Pressable,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing } from '@/design-system';
import { haptic, type HapticStyle } from '@/lib/haptics';
import { AppText } from './AppText';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  hapticFeedback?: HapticStyle;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  hapticFeedback = 'light',
  style,
}: ButtonProps) {
  const handlePress = () => {
    if (disabled || loading) return;
    haptic.trigger(hapticFeedback);
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        style,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.surface : colors.accent}
        />
      ) : (
        <AppText style={[styles.label, variant !== 'primary' && styles.darkLabel]}>
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  primary: {
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.primaryText,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryText,
  },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.error },
  label: { color: colors.surface, fontWeight: '600' },
  darkLabel: { color: colors.primaryText },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.5 },
});
