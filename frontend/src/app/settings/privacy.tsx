import { t } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { SpringPressable } from '@/components/motion/SpringPressable';
import { AppText } from '@/components/ui';
import {
  AccountCard,
  AccountScaffold,
  accountStyles,
} from '@/features/account/components/AccountScaffold';
import { colors, spacing } from '@/design-system';

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
          <Ionicons name="shield-checkmark" size={27} color={colors.onAccent} />
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
                <Ionicons name={principle.icon} size={19} color={colors.primaryText} />
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
        <SpringPressable
          accessibilityRole="button"
          accessibilityLabel={t('settings.openThePrivacyPolicy')}
          pressScale={0.985}
          haptic="selection"
          onPress={() => router.push('/legal/privacy' as never)}
          style={styles.linkRow}
        >
          <View style={styles.linkLeft}>
            <Ionicons name="document-text-outline" size={18} color={colors.primaryText} />
            <AppText style={styles.linkTitle}>{t('common.privacyPolicy')}</AppText>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.tertiaryText} />
        </SpringPressable>

        <SpringPressable
          accessibilityRole="button"
          accessibilityLabel={t('settings.openTheTermsOfService')}
          pressScale={0.985}
          haptic="selection"
          onPress={() => router.push('/legal/terms' as never)}
          style={styles.linkRow}
        >
          <View style={styles.linkLeft}>
            <Ionicons name="shield-outline" size={18} color={colors.primaryText} />
            <AppText style={styles.linkTitle}>
              {t('common.termsOfServiceAndEula')}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.tertiaryText} />
        </SpringPressable>
      </AccountCard>
    </AccountScaffold>
  );
}

const styles = StyleSheet.create({
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  intro: { fontSize: 14, lineHeight: 20 },
  list: { gap: spacing.md },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  itemTitle: { fontWeight: '700' },
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
    color: colors.primaryText,
  },
  pressed: {
    opacity: 0.7,
  },
});
