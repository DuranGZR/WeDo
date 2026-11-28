import { t } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn, useReducedMotion } from 'react-native-reanimated';

import { SpringPressable } from '@/components/motion/SpringPressable';
import { AppText, Badge, Screen, ScreenHeader } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';

export default function InviteInvalidScreen() {
  useTranslation();
  const reducedMotion = useReducedMotion();
  return (
    <Screen scroll={true}>
      <ScreenHeader fallbackHref="/(tabs)" />
      <View style={styles.content}>
        <View style={styles.center}>
          <Animated.View
            entering={reducedMotion ? undefined : ZoomIn.duration(260)}
            style={styles.mark}
          >
            <AppText style={styles.markText}>!</AppText>
          </Animated.View>
          <Badge label={t('common.invitationNotFound')} tone="error" />
          <AppText variant="largeTitle">
            {t('common.thisInviteLinkIsNoLongerValid')}
          </AppText>
          <AppText muted style={styles.copy}>
            {t('common.theLinkMayHaveExpiredOrTheInvitationMayHave')}
          </AppText>
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.delay(90).duration(240)}
            style={[styles.glassCard, styles.card]}
          >
            <AppText variant="cardTitle">{t('common.whatCanYouDo')}</AppText>
            <AppText muted>{t('common.askTheSpaceOwnerForANewInviteLink')}</AppText>
          </Animated.View>
          <SpringPressable
            haptic="light"
            onPress={() => router.replace('/(tabs)')}
            style={styles.primaryBtn}
          >
            <AppText style={styles.primaryBtnText}>{t('common.backToHome')}</AppText>
          </SpringPressable>
          <SpringPressable
            haptic="selection"
            onPress={() => router.back()}
            style={styles.ghostBtn}
          >
            <AppText style={styles.ghostBtnText}>{t('common.goBack_e0c40')}</AppText>
          </SpringPressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: spacing.lg,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.huge,
  },
  center: { flex: 1, justifyContent: 'center', gap: spacing.md },
  mark: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.errorSoft,
    marginBottom: spacing.sm,
  },
  markText: { fontSize: 32, fontWeight: '700', color: colors.error },
  copy: { lineHeight: 22 },
  card: { gap: spacing.xs, marginVertical: spacing.sm },
  glassCard: {
    borderRadius: radius.cardLg,
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
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  ghostBtn: {
    minHeight: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: 'transparent',
  },
  ghostBtnText: {
    color: colors.primaryText,
    fontWeight: '600',
  },
});
