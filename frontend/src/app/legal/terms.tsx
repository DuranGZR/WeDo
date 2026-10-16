import { t } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Screen } from '@/components/ui';
import { mono, radius, spacing } from '@/design-system';

export default function LegalTermsScreen() {
  useTranslation();
  return (
    <Screen scroll={true} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <AppText variant="screenTitle" style={styles.title}>
            {t('common.termsOfServiceAndEula')}
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
          {t('legal.lastUpdated1January2026')}
        </AppText>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <AppText variant="sectionTitle" style={styles.sectionTitle}>
            {t('legal.1AcceptanceOfTheseTerms')}
          </AppText>
          <AppText style={styles.paragraph}>
            {t('legal.byDownloadingWedoCreatingAnAccountOrUsingTheApp')}
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="sectionTitle" style={styles.sectionTitle}>
            {t('legal.2UserContentAndZeroTolerancePolicy')}
          </AppText>
          <AppText style={styles.paragraph}>{t('legal.userContentPolicy')}</AppText>
          <AppText style={styles.paragraph}>
            {t('legal.theFollowingContentIsProhibited')}
          </AppText>
          <AppText style={styles.bullet}>
            {t('legal.harassmentHateSpeechDiscriminationOrThreats')}
          </AppText>
          <AppText style={styles.bullet}>
            {t('legal.obscenePornographicOrViolentImagesAndText')}
          </AppText>
          <AppText style={styles.bullet}>
            {t('legal.materialThatInfringesCopyrightOrOtherIntellectualPropertyRights')}
          </AppText>
          <AppText style={styles.bullet}>
            {t('legal.contentThatPromotesIllegalActivities')}
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="sectionTitle" style={styles.sectionTitle}>
            {t('legal.3ReportsAndModeration')}
          </AppText>
          <AppText style={styles.paragraph}>{t('legal.reportPolicy')}</AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="sectionTitle" style={styles.sectionTitle}>
            {t('legal.4AccountSecurityAndTermination')}
          </AppText>
          <AppText style={styles.paragraph}>
            {t('legal.youAreResponsibleForKeepingYourAccountSecureYouMay')}
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="sectionTitle" style={styles.sectionTitle}>
            {t('legal.5SupportAndContact')}
          </AppText>
          <AppText style={styles.paragraph}>
            {t('legal.forQuestionsAboutTheseTermsOrHelpWithTheApp')}
          </AppText>
          <Pressable
            accessibilityRole="link"
            onPress={() =>
              void Linking.openURL(
                `mailto:contact@durangezer.com?subject=${encodeURIComponent(t('legal.supportSubject'))}`,
              )
            }
            style={({ pressed }) => [styles.emailLink, pressed && styles.pressed]}
          >
            <Ionicons name="mail-outline" size={17} color={mono.ink} />
            <AppText style={styles.emailText}>contact@durangezer.com</AppText>
          </Pressable>
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
    fontSize: 24,
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
  emailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  emailText: {
    fontSize: 14,
    fontWeight: '700',
    color: mono.ink,
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.7,
  },
});
