import { t } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import {
  AccountCard,
  AccountScaffold,
  accountStyles,
} from '@/features/account/components/AccountScaffold';
import { mono, spacing } from '@/design-system';

const principles = [
  {
    icon: 'people-outline' as const,
    get title() {
      return t('settings.yourSpacesAreInviteOnly');
    },
    get text() {
      return t('settings.onlyTheOwnerAndInvitedMembersCanViewASpace');
    },
  },
  {
    icon: 'link-outline' as const,
    get title() {
      return t('settings.yourSavedItemsArePrivate');
    },
    get text() {
      return t('settings.yourLinksNotesAndCompletionStatusArenTPublic');
    },
  },
  {
    icon: 'key-outline' as const,
    get title() {
      return t('settings.youReInControlOfAccess');
    },
    get text() {
      return t('settings.changeYourPasswordOrSignOutOfEveryDeviceIn');
    },
  },
];

export default function PrivacyScreen() {
  useTranslation();
  return (
    <AccountScaffold
      title={t('common.privacy')}
      subtitle={t('settings.youReInControlOfYourSharedDecisionsOnWedo')}
    >
      <AccountCard>
        <View style={styles.heroIcon}>
          <Ionicons name="shield-checkmark" size={27} color={mono.paper} />
        </View>
        <AppText variant="sectionTitle">{t('settings.privateByDefault')}</AppText>
        <AppText muted style={styles.intro}>
          {t('settings.wedoIsnTAPublicSocialNetworkYourSpacesLists')}
        </AppText>
      </AccountCard>

      <View style={styles.list}>
        {principles.map((principle) => (
          <AccountCard key={principle.title}>
            <View style={styles.itemHeader}>
              <View style={styles.itemIcon}>
                <Ionicons name={principle.icon} size={19} color={mono.ink} />
              </View>
              <AppText style={styles.itemTitle}>{principle.title}</AppText>
            </View>
            <AppText muted style={accountStyles.note}>
              {principle.text}
            </AppText>
          </AccountCard>
        ))}
      </View>

      <AccountCard>
        <AppText variant="caption" style={accountStyles.label}>
          {t('settings.yourData')}
        </AppText>
        <AppText muted style={accountStyles.note}>
          {t('settings.yourProfileStoresYourDisplayNameAndEmailAddressThe')}
        </AppText>
      </AccountCard>

      <AccountCard>
        <AppText variant="caption" style={accountStyles.label}>
          {t('settings.legalDocuments')}
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
          accessibilityLabel={t('settings.openTheTermsOfService')}
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
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mono.ink,
  },
  intro: { fontSize: 14, lineHeight: 20 },
  list: { gap: spacing.md },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mono.soft,
  },
  itemTitle: { fontWeight: '800' },
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
  pressed: {
    opacity: 0.7,
  },
});
