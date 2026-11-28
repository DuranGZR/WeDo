import { t } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { SpringPressable } from '@/components/motion/SpringPressable';
import { LAYOUT_SPRING } from '@/components/motion/springs';
import {
  AppText,
  BrandLogo,
  Card,
  Screen,
  ScreenHeader,
  TextField,
} from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';
import { useCreateSpace } from '@/features/spaces/hooks';
import { haptic } from '@/lib/haptics';
import { useAuthStore } from '@/store/auth-store';

const suggestions = () => [
  t('spaces.ourSpace'),
  t('spaces.weekendPlans'),
  t('spaces.thingsToDoTogether'),
];

export default function CreateSpaceScreen() {
  useTranslation();
  const reducedMotion = useReducedMotion();
  const [name, setName] = useState('');
  const create = useCreateSpace();

  async function handleBack() {
    haptic.light();
    if (router.canGoBack()) {
      router.back();
    } else {
      await useAuthStore.getState().signOut();
      router.replace('/(auth)/welcome');
    }
  }

  async function submit() {
    if (name.trim().length < 2) {
      Alert.alert(t('spaces.spaceNameRequired'), t('validation.minTwo'));
      return;
    }
    try {
      const space = await create.mutateAsync({ name: name.trim(), type: 'couple' });
      // Redirect to invite screen for this newly created space
      router.replace(`/(onboarding)/invite-member?spaceId=${space.id}`);
    } catch {
      Alert.alert(
        t('spaces.couldnTCreateSpace'),
        t('lists.checkYourConnectionAndTryAgain'),
      );
    }
  }

  return (
    <Screen scroll={true}>
      <ScreenHeader onBack={() => void handleBack()} />

      <View style={styles.content}>
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.duration(260)}
          style={styles.brandHeader}
        >
          <BrandLogo animated />
          <AppText variant="largeTitle" style={styles.title}>
            {t('spaces.giveYourSharedSpaceAName')}
          </AppText>
          <AppText muted style={styles.subtitle}>
            {t('spaces.onlyMembersOfThisSpaceCanSeeItsName')}
          </AppText>
        </Animated.View>

        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.delay(70).duration(280)}
          layout={reducedMotion ? undefined : LAYOUT_SPRING}
        >
          <Card style={styles.formCard}>
            <View style={styles.form}>
              <TextField
                autoFocus
                label={t('spaces.spaceName')}
                placeholder={t('spaces.eGPekCan')}
                value={name}
                onChangeText={setName}
              />

              <View style={styles.suggestionsContainer}>
                <AppText variant="caption" muted style={styles.suggestionsLabel}>
                  {t('spaces.suggestions')}
                </AppText>
                <View style={styles.chipsWrapper}>
                  {suggestions().map((suggestion) => (
                    <SpringPressable
                      key={suggestion}
                      pressScale={0.95}
                      haptic="selection"
                      onPress={() => setName(suggestion)}
                      style={[
                        styles.suggestionChip,
                        name === suggestion && styles.activeChip,
                      ]}
                    >
                      <AppText
                        style={[
                          styles.chipText,
                          name === suggestion && styles.activeChipText,
                        ]}
                      >
                        {suggestion}
                      </AppText>
                    </SpringPressable>
                  ))}
                </View>
              </View>

              <SpringPressable
                haptic="medium"
                onPress={() => void submit()}
                disabled={create.isPending || !name.trim()}
                style={[
                  styles.primaryBtn,
                  (create.isPending || !name.trim()) && styles.btnDisabled,
                ]}
              >
                {create.isPending ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <>
                    <AppText style={styles.primaryBtnText}>
                      {t('spaces.createSpace')}
                    </AppText>
                    <Ionicons name="arrow-forward" size={18} color={colors.surface} />
                  </>
                )}
              </SpringPressable>
            </View>
          </Card>
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xl,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: spacing.huge,
  },
  brandHeader: {
    alignItems: 'center',
    gap: spacing.xs,
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
    paddingHorizontal: spacing.lg,
  },
  formCard: {
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceCard,
    padding: spacing.xl,
    ...shadows.card,
  },
  form: {
    gap: spacing.md,
  },
  suggestionsContainer: {
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  suggestionsLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  suggestionChip: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeChip: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  chipText: {
    fontSize: 13,
    color: colors.secondaryText,
  },
  activeChipText: {
    color: colors.onAccent,
    fontWeight: '600',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    minHeight: 54,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xs,
    gap: spacing.sm,
    ...shadows.pillAction,
  },
  primaryBtnText: {
    color: colors.onAccent,
    fontSize: 16,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.45,
  },
});
