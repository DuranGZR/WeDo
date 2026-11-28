import { t } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, ZoomIn, useReducedMotion } from 'react-native-reanimated';

import { SpringPressable } from '@/components/motion/SpringPressable';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { AppText, Card, Screen, ScreenHeader } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';

const options = [
  {
    id: 'option-1',
    get label() {
      return t('onboarding.withMyPartner');
    },
    emoji: '🧡',
  },
  {
    id: 'option-2',
    get label() {
      return t('onboarding.withFriends');
    },
    emoji: '👥',
  },
  {
    id: 'option-3',
    get label() {
      return t('onboarding.withAHousemate');
    },
    emoji: '🏠',
  },
  {
    id: 'option-4',
    get label() {
      return t('onboarding.withFamily');
    },
    emoji: '👨‍👩‍👧‍👦',
  },
  {
    id: 'option-5',
    get label() {
      return t('onboarding.withAGroup');
    },
    emoji: '🎒',
  },
  {
    id: 'option-6',
    get label() {
      return t('onboarding.onMyOwn');
    },
    emoji: '🦊',
  },
];

export default function UsageTypeScreen() {
  useTranslation();
  const reducedMotion = useReducedMotion();
  const [selected, setSelected] = useState('');

  return (
    <Screen scroll={true}>
      <ScreenHeader fallbackHref="/" />

      <View style={styles.content}>
        <OnboardingProgress step={1} total={4} />

        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.duration(280)}
          style={styles.header}
        >
          <AppText variant="largeTitle" style={styles.title}>
            {t('onboarding.whoWillYouUseWedoWith')}
          </AppText>
          <AppText muted style={styles.subtitle}>
            {t('onboarding.weLlSuggestSomeListsToHelpYouGetStarted')}
          </AppText>
        </Animated.View>

        <View style={styles.grid}>
          {options.map((option, index) => {
            const isSelected = selected === option.id;
            return (
              <Animated.View
                key={option.id}
                entering={
                  reducedMotion
                    ? undefined
                    : FadeInDown.delay(50 + index * 35).duration(240)
                }
                style={styles.pressableCard}
              >
                <SpringPressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  pressScale={0.96}
                  haptic="selection"
                  onPress={() => setSelected(option.id)}
                >
                  <Card style={[styles.optionCard, isSelected && styles.selectedCard]}>
                    <View style={styles.cardContent}>
                      <View
                        style={[styles.emojiPill, isSelected && styles.emojiPillSelected]}
                      >
                        <AppText style={styles.emoji}>{option.emoji}</AppText>
                      </View>
                      <AppText
                        variant="cardTitle"
                        style={[styles.cardLabel, isSelected && styles.selectedLabel]}
                      >
                        {option.label}
                      </AppText>
                    </View>
                    {isSelected ? (
                      <Animated.View
                        entering={reducedMotion ? undefined : ZoomIn.duration(180)}
                        style={styles.checkIndicator}
                      >
                        <Ionicons name="checkmark-circle" size={20} color="#9E7F60" />
                      </Animated.View>
                    ) : null}
                  </Card>
                </SpringPressable>
              </Animated.View>
            );
          })}
        </View>

        <SpringPressable
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.continue')}
          haptic="medium"
          onPress={() => router.push('/(onboarding)/list-templates')}
          disabled={!selected}
          style={[styles.primaryBtn, !selected && styles.btnDisabled]}
        >
          <AppText style={styles.primaryBtnText}>{t('onboarding.continue')}</AppText>
          <Ionicons name="arrow-forward" size={18} color={colors.onAccent} />
        </SpringPressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: spacing.xl,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: spacing.huge,
  },
  header: {
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  title: {
    fontWeight: '700',
    color: colors.primaryText,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: colors.secondaryText,
    paddingHorizontal: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  pressableCard: {
    width: '47%',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceCard,
    height: 84,
    ...shadows.card,
  },
  selectedCard: {
    borderWidth: 1.5,
    borderColor: '#9E7F60',
    backgroundColor: '#FAF5EE',
    ...shadows.elevated,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  emojiPill: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiPillSelected: {
    backgroundColor: 'rgba(158, 127, 96, 0.16)',
  },
  emoji: {
    fontSize: 19,
  },
  cardLabel: {
    flex: 1,
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '600',
  },
  selectedLabel: {
    color: colors.primaryText,
    fontWeight: '700',
  },
  checkIndicator: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    minHeight: 54,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    width: '100%',
    ...shadows.pillAction,
  },
  btnDisabled: {
    opacity: 0.42,
  },
  primaryBtnText: {
    color: colors.onAccent,
    fontSize: 16,
    fontWeight: '700',
  },
});
