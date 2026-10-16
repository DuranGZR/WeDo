import { t } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import {
  AccountCard,
  AccountScaffold,
  accountStyles,
} from '@/features/account/components/AccountScaffold';
import { mono, spacing } from '@/design-system';

const topics = [
  {
    get title() {
      return t('settings.whatIsWedoFor');
    },
    get text() {
      return t('settings.saveALinkToYourSharedSpaceDecideTogetherAnd');
    },
  },
  {
    get title() {
      return t('settings.howDoIInviteSomeone');
    },
    get text() {
      return t('settings.shareAnInviteLinkFromTheInviteYourPartnerCard');
    },
  },
  {
    get title() {
      return t('settings.howDoIAddALink');
    },
    get text() {
      return t('settings.tapShareInAnyAppAndChooseWedoYouCan');
    },
  },
  {
    get title() {
      return t('settings.howDoIMarkAnItemAsDone');
    },
    get text() {
      return t('settings.openAnItemInAListAndMarkItAs');
    },
  },
];

function HelpTopic({ title, text }: { title: string; text: string }) {
  useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ expanded: open }}
      onPress={() => setOpen((value) => !value)}
      style={({ pressed }) => [styles.topic, pressed && styles.pressed]}
    >
      <View style={styles.topicHeader}>
        <AppText style={styles.topicTitle}>{title}</AppText>
        <Ionicons name={open ? 'remove' : 'add'} size={20} color={mono.ink} />
      </View>
      {open ? (
        <AppText muted style={styles.topicText}>
          {text}
        </AppText>
      ) : null}
    </Pressable>
  );
}

export default function HelpScreen() {
  useTranslation();
  return (
    <AccountScaffold
      title={t('settings.helpSupport')}
      subtitle={t('settings.aQuickGuideToUsingWedoTogether')}
    >
      <AccountCard>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="sparkles" size={25} color={mono.paper} />
          </View>
          <View style={styles.heroCopy}>
            <AppText variant="sectionTitle">{t('settings.decideTogether')}</AppText>
            <AppText muted style={styles.heroText}>
              {t('settings.saveShareChooseAndMakeItHappen')}
            </AppText>
          </View>
        </View>
      </AccountCard>

      <View style={styles.topics}>
        {topics.map((topic) => (
          <HelpTopic key={topic.title} {...topic} />
        ))}
      </View>

      <AccountCard>
        <AppText variant="caption" style={accountStyles.label}>
          {t('settings.contactSupport')}
        </AppText>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={t('settings.emailSupport')}
          onPress={() => void Linking.openURL('mailto:contact@durangezer.com')}
          style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
        >
          <View style={styles.linkLeft}>
            <Ionicons name="mail-outline" size={18} color={mono.ink} />
            <AppText style={styles.linkTitle}>contact@durangezer.com</AppText>
          </View>
          <Ionicons name="open-outline" size={16} color={mono.muted} />
        </Pressable>

        <Pressable
          accessibilityRole="link"
          accessibilityLabel={t('settings.reportInappropriateContentOrAUser')}
          onPress={() =>
            void Linking.openURL(
              `mailto:contact@durangezer.com?subject=${encodeURIComponent(t('settings.reportSubject'))}`,
            )
          }
          style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
        >
          <View style={styles.linkLeft}>
            <Ionicons name="flag-outline" size={18} color={mono.ink} />
            <AppText style={styles.linkTitle}>{t('settings.reportContentUser')}</AppText>
          </View>
          <Ionicons name="open-outline" size={16} color={mono.muted} />
        </Pressable>
      </AccountCard>

      <AccountCard>
        <AppText variant="caption" style={accountStyles.label}>
          {t('settings.legal')}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('settings.openThePrivacyPolicy')}
          onPress={() => router.push('/legal/privacy' as never)}
          style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
        >
          <View style={styles.linkLeft}>
            <Ionicons name="document-text-outline" size={18} color={mono.ink} />
            <AppText style={styles.linkTitle}>{t('common.privacyPolicy')}</AppText>
          </View>
          <Ionicons name="chevron-forward" size={16} color={mono.muted} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('settings.openTheTermsOfServiceAndEula')}
          onPress={() => router.push('/legal/terms' as never)}
          style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
        >
          <View style={styles.linkLeft}>
            <Ionicons name="shield-outline" size={18} color={mono.ink} />
            <AppText style={styles.linkTitle}>
              {t('common.termsOfServiceAndEula')}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={16} color={mono.muted} />
        </Pressable>
      </AccountCard>
    </AccountScaffold>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mono.ink,
  },
  heroCopy: { flex: 1, gap: 2 },
  heroText: { fontSize: 13 },
  topics: { gap: spacing.sm },
  topic: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: mono.ink,
    borderRadius: 14,
    backgroundColor: mono.paper,
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  topicTitle: { flex: 1, fontWeight: '800' },
  topicText: { fontSize: 13, lineHeight: 19 },
  pressed: { opacity: 0.84 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: mono.ink,
  },
});
