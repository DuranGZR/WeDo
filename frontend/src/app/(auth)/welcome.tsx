import { t } from '@/i18n';
import { useTranslation, Trans } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
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
  withTiming,
} from 'react-native-reanimated';

import { WelcomeDeck } from '@/components/auth/WelcomeDeck';
import { ENTER_EASING } from '@/components/motion/springs';
import { SpringPressable } from '@/components/motion/SpringPressable';
import { AppText, BrandLogo, Screen } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';

export default function WelcomeScreen() {
  useTranslation();
  const reducedMotion = useReducedMotion();
  const arrowNudge = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      arrowNudge.set(0);
      return;
    }
    arrowNudge.set(
      withDelay(
        900,
        withRepeat(
          withSequence(
            withTiming(4, { duration: 750, easing: Easing.inOut(Easing.cubic) }),
            withTiming(0, { duration: 750, easing: Easing.inOut(Easing.cubic) }),
            withDelay(2200, withTiming(0, { duration: 100 })),
          ),
          -1,
          false,
        ),
      ),
    );
  }, [arrowNudge, reducedMotion]);

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: arrowNudge.get() }],
  }));

  return (
    <Screen scroll={true} ambient="hero" contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.brandWrap}>
          <BrandLogo size="lg" animated delayMs={30} />
        </View>

        <WelcomeDeck />

        <View style={styles.bottomStack}>
          <Animated.View
            entering={
              reducedMotion
                ? undefined
                : FadeInDown.delay(180).duration(260).easing(ENTER_EASING)
            }
            style={styles.copy}
          >
            <AppText style={styles.title}>{t('auth.decideTogether')}</AppText>
            <AppText style={styles.subtitle}>
              {t('auth.saveWhatCatchesYourEyeChooseTogetherMakeAPlan')}
            </AppText>
          </Animated.View>

          <View style={styles.actions}>
            <Animated.View
              entering={
                reducedMotion
                  ? undefined
                  : FadeInDown.delay(240).duration(260).easing(ENTER_EASING)
              }
            >
              <SpringPressable
                accessibilityRole="button"
                accessibilityLabel={t('auth.createAccount')}
                haptic="medium"
                onPress={() => router.push('/(auth)/sign-up')}
                style={styles.primaryButton}
              >
                <AppText style={styles.primaryButtonText}>{t('auth.getStarted')}</AppText>
                <Animated.View style={arrowStyle}>
                  <Ionicons name="arrow-forward" size={18} color={colors.onAccent} />
                </Animated.View>
              </SpringPressable>
            </Animated.View>

            <Animated.View
              entering={
                reducedMotion
                  ? undefined
                  : FadeInDown.delay(300).duration(250).easing(ENTER_EASING)
              }
            >
              <SpringPressable
                accessibilityRole="button"
                accessibilityLabel={t('common.signIn')}
                haptic="selection"
                onPress={() => router.push('/(auth)/sign-in')}
                style={styles.secondaryButton}
              >
                <AppText style={styles.secondaryButtonText}>
                  {t('auth.iAlreadyHaveAnAccount')}
                </AppText>
              </SpringPressable>
            </Animated.View>

            <Animated.View
              entering={reducedMotion ? undefined : FadeIn.delay(490).duration(280)}
            >
              <AppText style={styles.legal}>
                <Trans
                  i18nKey="auth.continuingAgreement"
                  components={{
                    terms: (
                      <AppText
                        style={styles.legalLink}
                        onPress={() => router.push('/legal/terms' as never)}
                      />
                    ),
                    privacy: (
                      <AppText
                        style={styles.legalLink}
                        onPress={() => router.push('/legal/privacy' as never)}
                      />
                    ),
                  }}
                />
              </AppText>
            </Animated.View>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  container: {
    flex: 1,
    minHeight: 680,
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  brandWrap: {
    marginTop: spacing.xs,
    alignItems: 'center',
  },
  bottomStack: {
    gap: spacing.xl,
  },
  copy: { alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm },
  title: {
    color: colors.primaryText,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  subtitle: {
    maxWidth: 310,
    color: colors.secondaryText,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  actions: { gap: spacing.sm },
  primaryButton: {
    minHeight: 54,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    ...shadows.pillAction,
  },
  primaryButtonText: { color: colors.onAccent, fontSize: 15, fontWeight: '700' },
  secondaryButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.glassElevated,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.glass,
  },
  secondaryButtonText: { color: colors.primaryText, fontSize: 14, fontWeight: '700' },
  legal: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    color: colors.secondaryText,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  legalLink: {
    color: colors.primaryText,
    fontWeight: '600',
  },
});
