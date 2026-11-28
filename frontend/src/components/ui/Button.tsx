import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from 'react-native';

import { SpringPressable } from '@/components/motion/SpringPressable';
import { colors, radius, shadows, spacing } from '@/design-system';
import { type HapticStyle } from '@/lib/haptics';
import { AppText } from './AppText';
import { GlassSurface } from './GlassSurface';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  hapticFeedback?: HapticStyle;
  leftIcon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

const TEXT_COLORS: Record<ButtonVariant, string> = {
  primary: colors.onAccent,
  secondary: colors.primaryText,
  ghost: colors.primaryText,
  danger: colors.error,
};

const VARIANT_HAPTICS: Record<ButtonVariant, HapticStyle> = {
  primary: 'medium',
  secondary: 'light',
  ghost: 'light',
  danger: 'warning',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  hapticFeedback,
  leftIcon,
  style,
}: ButtonProps) {
  const handlePress = () => {
    if (disabled || loading) return;
    onPress();
  };

  const textColor = TEXT_COLORS[variant];
  const resolvedHaptic = hapticFeedback ?? VARIANT_HAPTICS[variant];

  return (
    <SpringPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      haptic={resolvedHaptic}
      onPress={handlePress}
      pressScale={0.965}
      pressOpacity={0.9}
      style={[
        styles.base,
        styles[variant],
        style,
        (disabled || loading) && styles.disabled,
      ]}
    >
      {variant === 'secondary' ? (
        <GlassSurface
          pointerEvents="none"
          tintColor="rgba(255, 255, 255, 0.56)"
          fallbackBackgroundColor={colors.glassElevated}
          style={styles.glassBackdrop}
        />
      ) : null}
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {leftIcon}
          <AppText style={[styles.label, { color: textColor }]}>{label}</AppText>
        </>
      )}
    </SpringPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    overflow: 'hidden',
  },
  glassBackdrop: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.pill,
  },
  primary: {
    backgroundColor: colors.accent,
    ...shadows.pillAction,
  },
  secondary: {
    backgroundColor: 'transparent',
    ...shadows.glass,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.errorSoft,
    borderWidth: 1,
    borderColor: 'rgba(184, 74, 66, 0.22)',
  },
  label: {
    fontWeight: '600',
    fontSize: 15,
  },
  disabled: {
    opacity: 0.5,
  },
});
