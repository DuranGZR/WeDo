import { t, formatLocale } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { useToast } from '@/components/feedback/AppToast';
import { AppText, TextField } from '@/components/ui';
import {
  AccountCard,
  AccountRow,
  AccountScaffold,
  accountStyles,
} from '@/features/account/components/AccountScaffold';
import { mono, spacing } from '@/design-system';
import { useAuthStore } from '@/store/auth-store';
import { LanguagePicker } from '@/components/ui/LanguagePicker';

export default function SettingsScreen() {
  useTranslation();
  const { user, updateProfile } = useAuthStore();
  const { showToast } = useToast();
  const [displayName, setDisplayName] = useState(user?.display_name ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => setDisplayName(user?.display_name ?? ''), [user?.display_name]);

  const isDirty = displayName.trim() !== (user?.display_name ?? '');
  const saveProfile = async () => {
    if (displayName.trim().length < 2) {
      showToast({
        title: t('settings.checkYourName'),
        message: t('settings.yourDisplayNameMustBeAtLeast2Characters'),
      });
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ displayName });
      showToast({
        title: t('settings.profileUpdated'),
        message: t('settings.yourDisplayNameHasBeenSaved'),
      });
    } catch (error) {
      showToast({
        title: t('settings.couldnTSave'),
        message: error instanceof Error ? error.message : t('settings.pleaseTryAgain'),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AccountScaffold
      title={t('settings.accountSettings')}
      subtitle={t('settings.manageYourProfileSecurityAndPreferences')}
    >
      <AccountCard>
        <LanguagePicker />
        <View style={styles.identityHeader}>
          <View style={styles.initialAvatar}>
            <AppText style={styles.initialText}>
              {user?.display_name?.trim().charAt(0).toLocaleUpperCase(formatLocale()) ??
                'W'}
            </AppText>
          </View>
          <View style={styles.identityCopy}>
            <AppText variant="sectionTitle">{t('settings.yourProfile')}</AppText>
            <AppText muted style={styles.identityHint}>
              {t('settings.wedoShowsYourInitialInsteadOfAProfilePhoto')}
            </AppText>
          </View>
        </View>
        <TextField
          label={t('settings.displayName')}
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          maxLength={80}
          placeholder={t('auth.yourName')}
          returnKeyType="done"
        />
        <View style={styles.emailBox}>
          <Ionicons name="mail-outline" size={18} color={mono.ink} />
          <View style={styles.emailCopy}>
            <AppText variant="caption" muted>
              {t('settings.emailAddress')}
            </AppText>
            <AppText numberOfLines={1}>{user?.email ?? '—'}</AppText>
          </View>
        </View>
        {user?.apple_email_forwarding_enabled === false && (
          <AppText muted>{t('settings.appleEmailForwardingDisabled')}</AppText>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('settings.saveProfileChanges')}
          disabled={!isDirty || saving}
          onPress={() => void saveProfile()}
          style={({ pressed }) => [
            accountStyles.primaryButton,
            (!isDirty || saving) && styles.disabledButton,
            (pressed || saving) && accountStyles.pressed,
          ]}
        >
          {saving ? (
            <ActivityIndicator color={mono.paper} />
          ) : (
            <Ionicons name="checkmark" size={19} color={mono.paper} />
          )}
          <AppText style={accountStyles.primaryButtonText}>
            {isDirty ? t('settings.saveChanges') : t('settings.changesSaved')}
          </AppText>
        </Pressable>
      </AccountCard>

      <View style={styles.sectionGroup}>
        <AppText variant="caption" style={accountStyles.label}>
          {t('settings.accountSecurity')}
        </AppText>
        <AccountCard>
          <AccountRow
            icon="lock-closed-outline"
            title={t('settings.passwordSessions')}
            description={t('settings.changeYourPasswordOrSignOutOfAllDevices')}
            onPress={() => router.push('/settings/security' as never)}
          />
          <View style={accountStyles.divider} />
          <AccountRow
            icon="notifications-outline"
            title={t('common.notifications')}
            description={t('settings.managePartnerAndPhoneNotifications')}
            onPress={() => router.push('/notifications')}
          />
        </AccountCard>
      </View>

      <View style={styles.sectionGroup}>
        <AppText variant="caption" style={accountStyles.label}>
          {t('home.helpInformation')}
        </AppText>
        <AccountCard>
          <AccountRow
            icon="shield-checkmark-outline"
            title={t('common.privacy')}
            description={t('settings.howYourDataAndSharedSpacesAreProtected')}
            onPress={() => router.push('/settings/privacy' as never)}
          />
          <View style={accountStyles.divider} />
          <AccountRow
            icon="help-circle-outline"
            title={t('home.helpGettingStarted')}
            description={t('home.yourGuideToUsingWedoTogether')}
            onPress={() => router.push('/settings/help' as never)}
          />
        </AccountCard>
      </View>

      <View style={styles.sectionGroup}>
        <AppText variant="caption" style={accountStyles.label}>
          {t('settings.accountActions')}
        </AppText>
        <AccountCard danger>
          <AccountRow
            icon="trash-outline"
            title={t('settings.deleteAccount')}
            description={t('settings.permanentlyDeleteYourAccountAndPersonalData')}
            onPress={() => router.push('/settings/delete-account' as never)}
            danger
          />
        </AccountCard>
      </View>
    </AccountScaffold>
  );
}

const styles = StyleSheet.create({
  identityHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  initialAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: mono.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialText: { color: mono.paper, fontSize: 22, fontWeight: '800' },
  identityCopy: { flex: 1, gap: 2 },
  identityHint: { fontSize: 12, lineHeight: 17 },
  emailBox: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: mono.line,
    backgroundColor: mono.soft,
  },
  emailCopy: { flex: 1, gap: 1 },
  disabledButton: { opacity: 0.48 },
  sectionGroup: { gap: spacing.sm },
});
