import { t } from '@/i18n';

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Dimensions, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { ListAppearancePicker } from '@/components/lists/ListAppearancePicker';
import { SpringPressable } from '@/components/motion/SpringPressable';
import { LAYOUT_SPRING } from '@/components/motion/springs';
import { AppText, Card, Screen, ScreenHeader, TextField } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';
import { formatListIcon, getListAppearance } from '@/features/lists/appearance';
import { useCreateList } from '@/features/lists/hooks';
import { haptic } from '@/lib/haptics';

const { width } = Dimensions.get('window');

export default function CreateListScreen() {
  useTranslation();
  const reducedMotion = useReducedMotion();
  const { spaceId } = useLocalSearchParams<{ spaceId: string }>();
  const [name, setName] = useState('');
  const [iconToken, setIconToken] = useState<string | undefined>(undefined);
  const create = useCreateList(spaceId ?? '');

  async function submit() {
    if (!spaceId || name.trim().length < 2) {
      haptic.warning();
      Alert.alert(
        t('items.error'),
        t('lists.pleaseEnterAListNameWithAtLeast2Characters'),
      );
      return;
    }
    try {
      const resolved = getListAppearance(name.trim(), false, iconToken);
      const list = await create.mutateAsync({
        name: name.trim(),
        icon: iconToken ?? formatListIcon(resolved.icon, resolved.backgroundColor),
      });
      router.replace(`/list/${list.id}`);
    } catch {
      haptic.error();
      Alert.alert(t('home.couldnTCreateList'), t('common.checkTheLinkAndTryAgain'));
    }
  }

  const isBtnDisabled = create.isPending || name.trim().length < 2;

  return (
    <Screen scroll={true}>
      <ScreenHeader />

      <View style={styles.content}>
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.duration(260)}
          style={styles.header}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="list-outline" size={22} color="#9E7F60" />
          </View>
          <AppText variant="largeTitle" style={styles.title}>
            {t('lists.newList')}
          </AppText>
          <AppText muted style={styles.subtitle}>
            {t('lists.createASharedListForTheThingsYouWantTo')}
          </AppText>
        </Animated.View>

        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.delay(70).duration(280)}
          layout={reducedMotion ? undefined : LAYOUT_SPRING}
        >
          <Card style={styles.formCard}>
            <View style={styles.form}>
              <TextField
                label={t('lists.listName')}
                autoFocus
                value={name}
                onChangeText={setName}
                placeholder={t('lists.eGPlacesMoviesFood')}
              />

              <ListAppearancePicker
                name={name}
                value={iconToken}
                onChange={setIconToken}
              />

              <SpringPressable
                haptic="medium"
                onPress={() => void submit()}
                disabled={isBtnDisabled}
                style={[styles.primaryBtn, isBtnDisabled && styles.btnDisabled]}
                accessibilityRole="button"
                accessibilityLabel={t('lists.createList')}
              >
                {create.isPending ? (
                  <ActivityIndicator color={colors.onAccent} />
                ) : (
                  <>
                    <AppText style={styles.primaryBtnText}>
                      {t('lists.createList')}
                    </AppText>
                    <Ionicons name="arrow-forward" size={18} color={colors.onAccent} />
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
    gap: spacing.lg,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.huge,
  },
  header: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  title: {
    fontSize: width > 400 ? 28 : 24,
    lineHeight: 34,
    fontWeight: '700',
    color: colors.primaryText,
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.secondaryText,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  formCard: {
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceCard,
    padding: spacing.lg,
    ...shadows.card,
  },
  form: {
    gap: spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(158, 127, 96, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(158, 127, 96, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    minHeight: 50,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginTop: spacing.sm,
    ...shadows.pillAction,
  },
  primaryBtnText: {
    color: colors.onAccent,
    fontSize: 15,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
