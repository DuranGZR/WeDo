import { t } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { SpringPressable } from '@/components/motion/SpringPressable';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { AppText, Card, Screen, ScreenHeader } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';

const { width } = Dimensions.get('window');

export default function ShareTutorialScreen() {
  useTranslation();
  const reducedMotion = useReducedMotion();
  return (
    <Screen scroll={true}>
      <ScreenHeader fallbackHref="/(tabs)" />

      <View style={styles.content}>
        <OnboardingProgress step={4} total={4} />

        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.duration(260)}
          style={styles.header}
        >
          <AppText variant="largeTitle" style={styles.title}>
            {t('onboarding.saveWhatYouDiscoverToWedo')}
          </AppText>
          <AppText muted style={styles.subtitle}>
            {t('onboarding.bringAnythingYouFindOnlineIntoYourSharedSpaceIn')}
          </AppText>
        </Animated.View>

        {/* Steps Cards */}
        <View style={styles.stepsContainer}>
          {/* Step 1: Paylaş'a dokun */}
          <Card style={styles.stepCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.stepBadge}>
                <AppText variant="caption" style={styles.stepBadgeText}>
                  {t('onboarding.step1')}
                </AppText>
              </View>
              <AppText variant="cardTitle" style={styles.stepTitle}>
                {t('onboarding.tapShare')}
              </AppText>
            </View>
            <AppText muted style={styles.stepDescription}>
              {t('onboarding.findSomethingYouLikeOnInstagramTiktokOrTheWeb')}
            </AppText>

            {/* Mock Visual: Social Badges */}
            <View style={styles.socialRow}>
              <View style={[styles.socialIconBadge, { backgroundColor: '#FDF2F4' }]}>
                <Ionicons name="logo-instagram" size={16} color="#E1306C" />
                <AppText
                  variant="caption"
                  style={[styles.socialText, { color: '#E1306C' }]}
                >
                  Instagram
                </AppText>
              </View>
              <View style={[styles.socialIconBadge, { backgroundColor: '#F5F5F5' }]}>
                <Ionicons name="logo-tiktok" size={16} color="#000000" />
                <AppText
                  variant="caption"
                  style={[styles.socialText, { color: '#000000' }]}
                >
                  TikTok
                </AppText>
              </View>
              <View style={[styles.socialIconBadge, { backgroundColor: '#EBF7FF' }]}>
                <Ionicons name="globe-outline" size={16} color="#0288D1" />
                <AppText
                  variant="caption"
                  style={[styles.socialText, { color: '#0288D1' }]}
                >
                  Web
                </AppText>
              </View>
              <View style={styles.shareIndicator}>
                <Ionicons name="share-outline" size={15} color={colors.primaryText} />
              </View>
            </View>
          </Card>

          {/* Step 2: WeDo'yu seç */}
          <Card style={styles.stepCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.stepBadge}>
                <AppText variant="caption" style={styles.stepBadgeText}>
                  {t('onboarding.step2')}
                </AppText>
              </View>
              <AppText variant="cardTitle" style={styles.stepTitle}>
                {t('onboarding.chooseWedo')}
              </AppText>
            </View>
            <AppText muted style={styles.stepDescription}>
              {t('onboarding.findWedoInTheShareSheetAndTapIt')}
            </AppText>

            {/* Mock Visual: Share Sheet */}
            <View style={styles.shareSheetMock}>
              <View style={styles.shareSheetItem}>
                <View style={styles.mockAppIconPlaceholder}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={18}
                    color={colors.secondaryText}
                  />
                </View>
                <AppText variant="caption" muted style={styles.mockAppName}>
                  {t('onboarding.messages')}
                </AppText>
              </View>
              <View style={[styles.shareSheetItem, styles.activeShareItem]}>
                <View style={styles.weDoIconContainer}>
                  <Image
                    source={require('../../../assets/app-icon.png')}
                    style={styles.weDoLogoIcon}
                    resizeMode="cover"
                  />
                </View>
                <AppText variant="caption" style={styles.weDoAppName}>
                  WeDo
                </AppText>
                <View style={styles.pingGlow} />
              </View>
              <View style={styles.shareSheetItem}>
                <View style={styles.mockAppIconPlaceholder}>
                  <Ionicons name="mail-outline" size={18} color={colors.secondaryText} />
                </View>
                <AppText variant="caption" muted style={styles.mockAppName}>
                  {t('onboarding.mail')}
                </AppText>
              </View>
              <View style={styles.shareSheetItem}>
                <View style={styles.mockAppIconPlaceholder}>
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={18}
                    color={colors.secondaryText}
                  />
                </View>
                <AppText variant="caption" muted style={styles.mockAppName}>
                  {t('onboarding.more')}
                </AppText>
              </View>
            </View>
          </Card>

          {/* Step 3: Listeyi belirle */}
          <Card style={styles.stepCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.stepBadge}>
                <AppText variant="caption" style={styles.stepBadgeText}>
                  {t('onboarding.step3')}
                </AppText>
              </View>
              <AppText variant="cardTitle" style={styles.stepTitle}>
                {t('onboarding.chooseAList')}
              </AppText>
            </View>
            <AppText muted style={styles.stepDescription}>
              {t('onboarding.pickTheSharedListToSaveItToThatS')}
            </AppText>

            {/* Mock Visual: Destination List */}
            <View style={styles.listsMock}>
              <View style={styles.mockListItem}>
                <View style={styles.mockListIcon}>
                  <AppText style={styles.emojiIcon}>🍽️</AppText>
                </View>
                <AppText variant="secondary" style={styles.mockListText}>
                  {t('onboarding.dinner')}
                </AppText>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={colors.tertiaryText}
                  style={{ marginLeft: 'auto' }}
                />
              </View>
              <View style={[styles.mockListItem, styles.mockListItemSelected]}>
                <View style={styles.mockListIcon}>
                  <AppText style={styles.emojiIcon}>✈️</AppText>
                </View>
                <AppText
                  variant="secondary"
                  style={[styles.mockListText, { fontWeight: '600' }]}
                >
                  {t('onboarding.weekendGetaway')}
                </AppText>
                <View style={styles.mockCheck}>
                  <Ionicons name="checkmark" size={12} color={colors.surface} />
                </View>
              </View>
              <View style={styles.mockListItem}>
                <View style={styles.mockListIcon}>
                  <AppText style={styles.emojiIcon}>🎬</AppText>
                </View>
                <AppText variant="secondary" style={styles.mockListText}>
                  {t('onboarding.movies')}
                </AppText>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={colors.tertiaryText}
                  style={{ marginLeft: 'auto' }}
                />
              </View>
            </View>
          </Card>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <SpringPressable
            haptic="light"
            onPress={() => router.replace('/(tabs)')}
            style={styles.primaryBtn}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.gotIt')}
          >
            <AppText style={styles.primaryBtnText}>{t('onboarding.gotIt')}</AppText>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={colors.onAccent}
              style={styles.btnIcon}
            />
          </SpringPressable>

          <SpringPressable
            haptic="selection"
            onPress={() => router.replace('/(tabs)')}
            style={styles.secondaryBtn}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.later')}
          >
            <AppText style={styles.secondaryBtnText}>{t('onboarding.later')}</AppText>
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
  header: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  title: {
    fontSize: width > 400 ? 28 : 24,
    lineHeight: width > 400 ? 34 : 30,
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
  stepsContainer: {
    gap: spacing.md,
  },
  stepCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceCard,
    padding: spacing.lg,
    ...shadows.card,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  stepBadge: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  stepBadgeText: {
    color: colors.primaryText,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.4,
  },
  stepTitle: {
    color: colors.primaryText,
    fontWeight: '700',
    fontSize: 16,
  },
  stepDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.secondaryText,
    marginBottom: spacing.md,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  socialIconBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  socialText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: spacing.xs,
  },
  shareIndicator: {
    marginLeft: 'auto',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareSheetMock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shareSheetItem: {
    alignItems: 'center',
    gap: 4,
    position: 'relative',
  },
  activeShareItem: {
    transform: [{ scale: 1.05 }],
  },
  mockAppIconPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(17, 17, 16, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weDoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.accent,
    ...shadows.glass,
  },
  weDoLogoIcon: {
    width: 28,
    height: 28,
  },
  mockAppName: {
    fontSize: 10,
    fontWeight: '500',
  },
  weDoAppName: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryText,
  },
  pingGlow: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  listsMock: {
    gap: spacing.xs,
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mockListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  mockListItemSelected: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    ...shadows.glass,
  },
  mockListIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  emojiIcon: {
    fontSize: 14,
  },
  mockListText: {
    fontSize: 13,
    color: colors.primaryText,
  },
  mockCheck: {
    marginLeft: 'auto',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
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
    ...shadows.pillAction,
  },
  primaryBtnText: {
    color: colors.onAccent,
    fontSize: 15,
    fontWeight: '700',
  },
  btnIcon: {
    marginTop: 1,
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassElevated,
    minHeight: 52,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.glass,
  },
  secondaryBtnText: {
    color: colors.primaryText,
    fontSize: 15,
    fontWeight: '700',
  },
});
