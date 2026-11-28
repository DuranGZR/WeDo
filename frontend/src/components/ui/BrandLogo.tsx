import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/design-system';
import { AppText } from './AppText';

const RIBBON_BACK = require('../../../assets/brand-ribbon-back.png');
const RIBBON_FRONT = require('../../../assets/brand-ribbon-front.png');

export type BrandLogoSize = 'sm' | 'md' | 'lg';

const MARK_SIZES: Record<BrandLogoSize, number> = {
  sm: 26,
  md: 32,
  lg: 38,
};

const WORDMARK_METRICS: Record<
  BrandLogoSize,
  { fontSize: number; lineHeight: number; letterSpacing: number; gap: number }
> = {
  sm: { fontSize: 22, lineHeight: 27, letterSpacing: -0.9, gap: 6 },
  md: { fontSize: 25, lineHeight: 30, letterSpacing: -1.0, gap: 7 },
  lg: { fontSize: 30, lineHeight: 36, letterSpacing: -1.1, gap: 8 },
};

const MARK_SPRING = {
  damping: 16,
  stiffness: 230,
  mass: 0.78,
} as const;

export function BrandMark({
  size = 34,
  animated = false,
  delayMs = 0,
}: {
  size?: number;
  animated?: boolean;
  delayMs?: number;
}) {
  const reducedMotion = useReducedMotion();
  const animateNow = animated && !reducedMotion;

  const frontY = useSharedValue(animateNow ? -12 : 0);
  const frontScale = useSharedValue(animateNow ? 0.86 : 1);
  const frontOpacity = useSharedValue(animateNow ? 0 : 1);

  const backX = useSharedValue(animateNow ? -5 : 0);
  const backY = useSharedValue(animateNow ? 6 : 0);
  const backOpacity = useSharedValue(animateNow ? 0 : 1);

  useEffect(() => {
    if (!animateNow) {
      frontY.set(0);
      frontScale.set(1);
      frontOpacity.set(1);
      backX.set(0);
      backY.set(0);
      backOpacity.set(1);
      return;
    }

    frontOpacity.set(
      withDelay(
        delayMs,
        withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) }),
      ),
    );
    frontY.set(withDelay(delayMs, withSpring(0, MARK_SPRING)));
    frontScale.set(withDelay(delayMs, withSpring(1, MARK_SPRING)));

    const backDelay = delayMs + 110;
    backOpacity.set(
      withDelay(
        backDelay,
        withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) }),
      ),
    );
    backX.set(withDelay(backDelay, withSpring(0, MARK_SPRING)));
    backY.set(withDelay(backDelay, withSpring(0, MARK_SPRING)));
  }, [animateNow, backOpacity, backX, backY, delayMs, frontOpacity, frontScale, frontY]);

  const frontStyle = useAnimatedStyle(() => ({
    opacity: frontOpacity.get(),
    transform: [{ translateY: frontY.get() }, { scale: frontScale.get() }],
  }));

  const backStyle = useAnimatedStyle(() => ({
    opacity: backOpacity.get(),
    transform: [{ translateX: backX.get() }, { translateY: backY.get() }],
  }));

  if (!animateNow) {
    return (
      <View style={[styles.markBox, { width: size, height: size }]}>
        <Image
          source={RIBBON_BACK}
          style={[styles.layer, { width: size, height: size }]}
          resizeMode="contain"
        />
        <Image
          source={RIBBON_FRONT}
          style={[styles.layer, { width: size, height: size }]}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <View style={[styles.markBox, { width: size, height: size }]}>
      <Animated.Image
        source={RIBBON_BACK}
        style={[styles.layer, { width: size, height: size }, backStyle]}
        resizeMode="contain"
      />
      <Animated.Image
        source={RIBBON_FRONT}
        style={[styles.layer, { width: size, height: size }, frontStyle]}
        resizeMode="contain"
      />
    </View>
  );
}

export function BrandLogo({
  size = 'md',
  animated = false,
  delayMs = 0,
}: {
  size?: BrandLogoSize;
  animated?: boolean;
  delayMs?: number;
}) {
  const reducedMotion = useReducedMotion();
  const animateWordmark = animated && !reducedMotion;
  const wordOpacity = useSharedValue(animateWordmark ? 0 : 1);
  const wordX = useSharedValue(animateWordmark ? -6 : 0);

  useEffect(() => {
    if (!animateWordmark) {
      wordOpacity.set(1);
      wordX.set(0);
      return;
    }
    const wordDelay = delayMs + 90;
    wordOpacity.set(
      withDelay(
        wordDelay,
        withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) }),
      ),
    );
    wordX.set(withDelay(wordDelay, withSpring(0, MARK_SPRING)));
  }, [animateWordmark, delayMs, wordOpacity, wordX]);

  const wordStyle = useAnimatedStyle(() => ({
    opacity: wordOpacity.get(),
    transform: [{ translateX: wordX.get() }],
  }));

  const markSize = MARK_SIZES[size];
  const metrics = WORDMARK_METRICS[size];

  return (
    <View
      accessible
      accessibilityLabel="WeDo"
      style={[styles.lockup, { gap: metrics.gap }]}
    >
      <BrandMark size={markSize} animated={animated} delayMs={delayMs} />
      <Animated.View style={wordStyle}>
        <AppText
          style={[
            styles.wordmark,
            {
              fontSize: metrics.fontSize,
              lineHeight: metrics.lineHeight,
              letterSpacing: metrics.letterSpacing,
            },
          ]}
        >
          WeDo.
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  lockup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markBox: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullSize: {
    flexShrink: 0,
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  wordmark: {
    color: colors.primaryText,
    fontWeight: '700',
  },
});
