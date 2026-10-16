import { t } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Screen } from '@/components/ui';
import { mono, radius, spacing } from '@/design-system';

export default function LegalPrivacyScreen() {
  useTranslation();
  return (
    <Screen scroll={true} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <AppText variant="screenTitle" style={styles.title}>
            {t('common.privacyPolicy')}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('legal.close')}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <Ionicons name="close" size={22} color={mono.ink} />
          </Pressable>
        </View>
        <AppText muted style={styles.date}>
          {t('legal.lastUpdated15October2026')}
        </AppText>
      </View>

      <View style={styles.content}>
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
            {t('legal.linksNotesListsVotesAndMemoryPhotosYouAddTo')}
          </AppText>
          <AppText style={styles.bullet}>
            •{' '}
            <AppText style={styles.bold}>{t('legal.deviceAndNotificationData')}</AppText>{' '}
            {t('legal.pushNotificationTokensUsedToNotifyYouOfActivityIn')}
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="sectionTitle" style={styles.sectionTitle}>
            {t('legal.3PermissionsCameraAndPhotos')}
          </AppText>
          <AppText style={styles.paragraph}>
            {t('legal.theAppRequestsAccessToYourCameraAndPhotoLibrary')}
          </AppText>
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
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    backgroundColor: mono.background,
  },
  header: {
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: mono.ink,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: mono.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  date: {
    fontSize: 13,
  },
  content: {
    gap: spacing.lg,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: mono.ink,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 21,
    color: mono.muted,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 21,
    color: mono.muted,
    paddingLeft: spacing.xs,
  },
  bold: {
    fontWeight: '700',
    color: mono.ink,
  },
  pressed: {
    opacity: 0.7,
  },
});
