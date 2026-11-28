import { t } from '@/i18n';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors, spacing } from '@/design-system';
import { AmbientBackground } from './AmbientBackground';
import { AppText } from './AppText';

const BRONZE_ICON = require('../../../assets/app-icon.png');

export function BrandedLaunchScreen() {
  useTranslation();
  const reducedMotion = useReducedMotion();

  const iconScale = useSharedValue(reducedMotion ? 1 : 0.88);
  const shimmerX = useSharedValue(-46);

  useEffect(() => {
    if (reducedMotion) {
      iconScale.set(1);
      shimmerX.set(0);
      return;
    }
    iconScale.set(withSpring(1, { damping: 16, stiffness: 200, mass: 0.82 }));
    shimmerX.set(
      withDelay(
        80,
        withRepeat(
          withSequence(
            withTiming(46, { duration: 620, easing: Easing.inOut(Easing.cubic) }),
            withTiming(-46, { duration: 620, easing: Easing.inOut(Easing.cubic) }),
          ),
          -1,
          false,
        ),
      ),
    );
  }, [iconScale, reducedMotion, shimmerX]);

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.get() }],
  }));

  const capsuleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.get() }],
  }));

  return (
    <View style={styles.root} accessibilityLabel="WeDo">
      <AmbientBackground variant="hero" />
      <View style={styles.center}>
        <Animated.View style={[styles.iconFrame, iconAnimStyle]}>
          <Image source={BRONZE_ICON} style={styles.iconImage} resizeMode="cover" />
        </Animated.View>

        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.delay(90).duration(280)}
          style={styles.copy}
        >
          <AppText style={styles.wordmark}>WeDo.</AppText>
          <AppText muted style={styles.tagline}>
            {t('common.saveTogetherMakeItHappenTogether')}
          </AppText>
        </Animated.View>

        <Animated.View
          entering={reducedMotion ? undefined : FadeIn.delay(160).duration(240)}
          style={styles.progressTrack}
        >
          <Animated.View style={[styles.progressThumb, capsuleStyle]} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },
  center: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  iconFrame: {
    width: 88,
    height: 88,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    shadowColor: '#2E2318',
    shadowOpacity: 0.22,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  iconImage: {
    width: '100%',
    height: '100%',
  },
  copy: {
    alignItems: 'center',
    gap: 6,
  },
  wordmark: {
    color: colors.primaryText,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -1.1,
  },
  tagline: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  progressTrack: {
    marginTop: spacing.xs,
    width: 124,
    height: 5,
    borderRadius: 99,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17, 17, 16, 0.08)',
  },
  progressThumb: {
    width: 44,
    height: 5,
    borderRadius: 99,
    backgroundColor: '#9E7F60',
  },
});
