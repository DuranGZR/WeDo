import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { SpringPressable } from '@/components/motion/SpringPressable';
import { colors, shadows } from '@/design-system';
import { type HapticStyle } from '@/lib/haptics';

export type IconButtonTone = 'glass' | 'dark' | 'neutral' | 'accent';

export function IconButton({
  icon,
  label,
  onPress,
  tone = 'glass',
  size = 44,
  hapticFeedback,
  style,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  tone?: IconButtonTone;
  size?: number;
  hapticFeedback?: HapticStyle;
  style?: StyleProp<ViewStyle>;
}) {
  const usesGlass = tone === 'glass' || tone === 'neutral';
  const resolvedHaptic: HapticStyle =
    hapticFeedback ?? (tone === 'dark' ? 'medium' : 'light');
  const pillRadius = size / 2;

  return (
    <SpringPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      haptic={resolvedHaptic}
      onPress={onPress}
      pressScale={0.91}
      pressOpacity={0.86}
      style={[
        styles.base,
        { width: size, height: size, borderRadius: pillRadius },
        tone === 'dark' && styles.dark,
        tone === 'accent' && styles.accent,
        usesGlass && shadows.glass,
        style,
      ]}
    >
      {usesGlass ? (
        <View
          pointerEvents="none"
          style={[styles.glassFill, { borderRadius: pillRadius }]}
        >
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0.28)',
              'rgba(255, 255, 255, 0.05)',
              'rgba(17, 17, 16, 0.05)',
            ]}
            locations={[0, 0.52, 1]}
            start={{ x: 0.14, y: 0.04 }}
            end={{ x: 0.86, y: 0.96 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
      ) : null}
      {icon}
    </SpringPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassFill: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    backgroundColor: 'rgba(17, 17, 16, 0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.78)',
  },
  dark: {
    backgroundColor: colors.accent,
    ...shadows.pillAction,
  },
  accent: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
