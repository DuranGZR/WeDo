import { t } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { SpringPressable } from '@/components/motion/SpringPressable';
import { AppText, Screen, ScreenHeader } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';

export default function NotFound() {
  useTranslation();
  const reducedMotion = useReducedMotion();
  return (
    <Screen scroll={true}>
      <ScreenHeader fallbackHref="/(tabs)" />

      <View style={styles.content}>
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.duration(240)}
          style={styles.glassCard}
        >
          <AppText variant="largeTitle">{t('common.pageNotFound')}</AppText>
          <AppText muted style={styles.copy}>
            {t('common.thisLinkMayHaveMovedOrIsNoLongerAvailable')}
          </AppText>
        </Animated.View>

        <SpringPressable
          accessibilityRole="button"
          haptic="light"
          onPress={() => router.replace('/')}
          style={styles.primaryBtn}
        >
          <AppText style={styles.primaryBtnText}>{t('common.backToHome')}</AppText>
        </SpringPressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  copy: { marginVertical: spacing.lg },
  content: {
    flex: 1,
    gap: spacing.lg,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.huge,
  },
  glassCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceCard,
    padding: spacing.xl,
    ...shadows.card,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    minHeight: 52,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    ...shadows.pillAction,
  },
  primaryBtnText: {
    color: colors.onAccent,
    fontSize: 15,
    fontWeight: '700',
  },
});
