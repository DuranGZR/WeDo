import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/design-system';

const WARM_GLOW = require('../../../assets/ambient-glow-warm.png');

export type AmbientBackgroundVariant = 'default' | 'subtle' | 'hero';

export function AmbientBackground({
  variant = 'default',
  backgroundColor = colors.background,
}: {
  variant?: AmbientBackgroundVariant;
  backgroundColor?: string;
}) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const primaryOpacity = variant === 'hero' ? 0.94 : variant === 'subtle' ? 0.52 : 0.78;
  const secondaryOpacity = variant === 'hero' ? 0.24 : variant === 'subtle' ? 0.12 : 0.18;

  const breathe = useSharedValue(0);

  useEffect(() => {
    if (variant !== 'hero' || reducedMotion) {
      breathe.set(0);
      return;
    }
    breathe.set(
      withRepeat(
        withSequence(
          withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.cubic) }),
          withTiming(0, { duration: 4200, easing: Easing.inOut(Easing.cubic) }),
        ),
        -1,
        false,
      ),
    );
  }, [breathe, reducedMotion, variant]);

  const heroGlowStyle = useAnimatedStyle(() => {
    if (variant !== 'hero') return {};
    const factor = breathe.get();
    return {
      opacity: primaryOpacity * (0.88 + 0.12 * factor),
      transform: [{ scale: 1 + 0.055 * factor }, { translateY: -8 * factor }],
    };
  });

  return (
    <View pointerEvents="none" style={[styles.container, { backgroundColor }]}>
      <LinearGradient
        colors={[
          'rgba(255, 253, 250, 0.76)',
          'rgba(246, 244, 240, 0)',
          'rgba(235, 226, 215, 0.36)',
        ]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 0.92, y: 0.95 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.Image
        source={WARM_GLOW}
        fadeDuration={0}
        resizeMode="stretch"
        style={[
          styles.primaryGlow,
          { top: insets.top - 88, opacity: primaryOpacity },
          heroGlowStyle,
        ]}
      />
      <Image
        source={WARM_GLOW}
        fadeDuration={0}
        resizeMode="stretch"
        style={[styles.secondaryGlow, { opacity: secondaryOpacity }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  primaryGlow: {
    position: 'absolute',
    right: -36,
    width: 480,
    height: 480,
  },
  secondaryGlow: {
    position: 'absolute',
    bottom: -155,
    left: -105,
    width: 420,
    height: 340,
    transform: [{ rotate: '180deg' }],
  },
});
