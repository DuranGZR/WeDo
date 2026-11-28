import { t } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking, StyleSheet, View } from 'react-native';

import { SpringPressable } from '@/components/motion/SpringPressable';
import { AppText, IconButton, Screen } from '@/components/ui';
import { colors, radius, shadows, spacing } from '@/design-system';

export default function LegalTermsScreen() {
  useTranslation();
  return (
    <Screen scroll={true} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <AppText variant="largeTitle" style={styles.title}>
            {t('common.termsOfServiceAndEula')}
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
      </View>

      <View style={styles.docCard}>
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
          <AppText style={styles.paragraph}>{t('legal.blockPolicy')}</AppText>
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
          <SpringPressable
            accessibilityRole="link"
            pressScale={0.97}
            haptic="selection"
            onPress={() =>
              void Linking.openURL(
                `mailto:contact@durangezer.com?subject=${encodeURIComponent(t('legal.supportSubject'))}`,
              )
            }
            style={styles.emailLink}
          >
            <Ionicons name="mail-outline" size={17} color={colors.primaryText} />
            <AppText style={styles.emailText}>contact@durangezer.com</AppText>
          </SpringPressable>
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
  emailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  emailText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.7,
  },
});
