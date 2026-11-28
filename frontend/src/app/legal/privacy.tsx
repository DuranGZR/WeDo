import { t } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { LAYOUT_SPRING } from '@/components/motion/springs';
import { AppText, IconButton, Screen } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';

export default function LegalPrivacyScreen() {
  useTranslation();
  const reducedMotion = useReducedMotion();
  return (
    <Screen scroll={true} contentContainerStyle={styles.container}>
      <Animated.View
        entering={reducedMotion ? undefined : FadeInDown.duration(220)}
        style={styles.header}
      >
        <View style={styles.headerTitleRow}>
          <AppText variant="largeTitle" style={styles.title}>
            {t('common.privacyPolicy')}
          </AppText>
          <IconButton
            icon={<Ionicons name="close" size={20} color={colors.primaryText} />}
            tone="glass"
            size={42}
            label={t('legal.close')}
            onPress={() => router.back()}
          />
        </View>
        <AppText muted style={styles.date}>
          {t('legal.updated20October2026')}
        </AppText>
      </Animated.View>

      <Animated.View
        entering={reducedMotion ? undefined : FadeInDown.delay(60).duration(240)}
        layout={reducedMotion ? undefined : LAYOUT_SPRING}
        style={styles.docCard}
      >
        <View style={styles.section}>
          <AppText variant="sectionTitle" style={styles.sectionTitle}>
            {t('legal.1OverviewAndOurCommitment')}
          </AppText>
          <AppText style={styles.paragraph}>
            {t('legal.wedoTheAppIsAPrivateSpaceForSavingIdeas')}
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="sectionTitle" style={styles.sectionTitle}>
            {t('legal.2InformationWeCollect')}
          </AppText>
          <AppText style={styles.paragraph}>
            {t('legal.weCollectTheFollowingInformationWhenYouUseTheApp')}
          </AppText>
          <AppText style={styles.bullet}>
            • <AppText style={styles.bold}>{t('legal.accountInformation')}</AppText>{' '}
            {t('legal.yourEmailAddressDisplayNameAndForPasswordBasedAccounts')}
          </AppText>
          <AppText style={styles.bullet}>
            • <AppText style={styles.bold}>{t('legal.signInWithApple')}</AppText>{' '}
            {t('legal.whenYouSignInWithAppleWeReceiveAnOpaque')}
          </AppText>
          <AppText style={styles.bullet}>
            • <AppText style={styles.bold}>{t('legal.signInWithGoogle')}</AppText>{' '}
            {t('legal.yourGoogleUserIdentifierVerifiedEmailAddressAndProfileName')}
          </AppText>
          <AppText style={styles.bullet}>
            •{' '}
            <AppText style={styles.bold}>{t('legal.supportAndDeletionRequests')}</AppText>{' '}
            {t('legal.theEmailAddressAndDescriptionYouSubmitAreSentTo')}
          </AppText>
          <AppText style={styles.bullet}>
            • <AppText style={styles.bold}>{t('legal.sharedContent')}</AppText>{' '}
            {t('legal.savedLinksAndPreviews')}
          </AppText>
          <AppText style={styles.bullet}>{t('legal.safetyData')}</AppText>
          <AppText style={styles.bullet}>
            •{' '}
            <AppText style={styles.bold}>{t('legal.deviceAndNotificationData')}</AppText>{' '}
            {t('legal.pushNotificationTokensUsedToNotifyYouOfActivityIn')}
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="sectionTitle" style={styles.sectionTitle}>
            {t('legal.3LinkPreviews')}
          </AppText>
          <AppText style={styles.paragraph}>{t('legal.howLinkPreviewsWork')}</AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="sectionTitle" style={styles.sectionTitle}>
            {t('legal.4SharingAndThirdPartyServices')}
          </AppText>
          <AppText style={styles.paragraph}>
            {t('legal.wedoDoesNotSellOrRentPersonalInformationToAdvertisers')}
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="sectionTitle" style={styles.sectionTitle}>
            {t('legal.5AccountAndDataDeletion')}
          </AppText>
          <AppText style={styles.paragraph}>
            {t('legal.youCanDeleteYourAccountAndAssociatedPersonalDataIn')}
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="sectionTitle" style={styles.sectionTitle}>
            {t('legal.6Contact')}
          </AppText>
          <AppText style={styles.paragraph}>{t('legal.contactPolicy')}</AppText>
        </View>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    flex: 1,
    fontWeight: '700',
    color: colors.primaryText,
  },
  date: {
    fontSize: 13,
  },
  docCard: {
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceCard,
    ...shadows.card,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryText,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.secondaryText,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.secondaryText,
    paddingLeft: spacing.xs,
  },
  bold: {
    fontWeight: '700',
    color: colors.primaryText,
  },
});
