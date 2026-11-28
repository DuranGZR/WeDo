import { t } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { ENTER_EASING, LAYOUT_SPRING } from '@/components/motion/springs';
import { AppText, BrandLogo, IconButton, Screen } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';

export const authColors = {
  background: colors.background,
  ink: colors.primaryText,
  paper: colors.surface,
  line: colors.border,
} as const;

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  belowCard?: ReactNode;
};

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  belowCard,
}: AuthShellProps) {
  useTranslation();
  const reducedMotion = useReducedMotion();

  return (
    <Screen scroll={true} ambient="subtle" contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <IconButton
            icon={<Ionicons name="arrow-back" size={20} color={colors.primaryText} />}
            tone="glass"
            size={42}
            label={t('common.goBack_e0c40')}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          />
          <BrandLogo size="sm" />
          <View style={styles.headerSpacer} />
        </View>

        <Animated.View
          entering={
            reducedMotion
              ? undefined
              : FadeInDown.delay(35).duration(240).easing(ENTER_EASING)
          }
          style={styles.titleBlock}
        >
          <AppText style={styles.title}>{title}</AppText>
          <AppText style={styles.subtitle}>{subtitle}</AppText>
        </Animated.View>

        <Animated.View
          entering={
            reducedMotion
              ? undefined
              : FadeInDown.delay(85).duration(260).easing(ENTER_EASING)
          }
          layout={reducedMotion ? undefined : LAYOUT_SPRING}
          style={styles.formCard}
        >
          {children}
        </Animated.View>

        {belowCard ? (
          <Animated.View
            entering={reducedMotion ? undefined : FadeIn.delay(145).duration(220)}
            layout={reducedMotion ? undefined : LAYOUT_SPRING}
            style={styles.belowCard}
          >
            {belowCard}
          </Animated.View>
        ) : null}

        <Animated.View
          entering={reducedMotion ? undefined : FadeIn.delay(175).duration(240)}
          layout={reducedMotion ? undefined : LAYOUT_SPRING}
          style={styles.footer}
        >
          {footer}
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { padding: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xl },
  container: {
    flex: 1,
    gap: spacing.lg,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: { width: 42, height: 42 },
  titleBlock: { alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm },
  title: {
    color: colors.primaryText,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.7,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.secondaryText,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  formCard: {
    padding: spacing.lg,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceCard,
    ...shadows.card,
  },
  belowCard: { alignItems: 'center', paddingHorizontal: spacing.md },
  footer: { alignItems: 'center', paddingBottom: spacing.sm },
});
