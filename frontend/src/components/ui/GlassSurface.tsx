import { BlurView } from 'expo-blur';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
  type GlassStyle,
} from 'expo-glass-effect';
import {
  Platform,
  StyleSheet,
  View,
  type ColorValue,
  type ViewProps,
} from 'react-native';

import { colors, shadows } from '@/design-system';

export type GlassSurfaceProps = ViewProps & {
  glassStyle?: GlassStyle;
  tintColor?: ColorValue;
  interactive?: boolean;
  blurIntensity?: number;
  elevated?: boolean;
  fallbackBackgroundColor?: ColorValue;
};

export function canUseLiquidGlass(): boolean {
  if (Platform.OS !== 'ios') return false;
  try {
    return isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  } catch {
    return false;
  }
}

export function GlassSurface({
  glassStyle = 'regular',
  tintColor = colors.glassTint,
  interactive = false,
  blurIntensity = 42,
  elevated = false,
  fallbackBackgroundColor = colors.glassLight,
  style,
  children,
  ...props
}: GlassSurfaceProps) {
  if (canUseLiquidGlass()) {
    return (
      <GlassView
        {...props}
        glassEffectStyle={glassStyle}
        tintColor={tintColor}
        isInteractive={interactive}
        colorScheme="light"
        style={[elevated && shadows.glass, style]}
      >
        {children}
      </GlassView>
    );
  }

  if (Platform.OS === 'ios') {
    return (
      <View
        {...props}
        style={[
          styles.fallbackContainer,
          { backgroundColor: fallbackBackgroundColor },
          elevated && shadows.glass,
          style,
        ]}
      >
        <BlurView
          intensity={blurIntensity}
          tint="light"
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
        />
        {children}
      </View>
    );
  }

  return (
    <View
      {...props}
      style={[
        styles.fallbackContainer,
        { backgroundColor: fallbackBackgroundColor },
        elevated && shadows.glass,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fallbackContainer: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
});
