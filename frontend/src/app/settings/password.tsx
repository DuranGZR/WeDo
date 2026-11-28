import { t } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useToast } from '@/components/feedback/AppToast';
import { SpringPressable } from '@/components/motion/SpringPressable';
import { AppText } from '@/components/ui';
import { colors, spacing } from '@/design-system';
import {
  AccountCard,
  AccountScaffold,
  accountStyles,
} from '@/features/account/components/AccountScaffold';
import { PasswordField } from '@/features/auth/PasswordField';
import { isStrongPassword } from '@/features/auth/password-strength';
import { useAuthStore } from '@/store/auth-store';

export default function ChangePasswordScreen() {
  useTranslation();
  const { user, changePassword } = useAuthStore();
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [saving, setSaving] = useState(false);

  if (user?.has_password === false) {
    return (
      <AccountScaffold
        title={t('common.password')}
        subtitle={t('settings.howYouSignInToYourAccount')}
      >
        <AccountCard>
          <View style={styles.appleHero}>
            <View style={styles.appleIconWrap}>
              <Ionicons name="logo-apple" size={28} color={colors.onAccent} />
            </View>
            <AppText variant="sectionTitle">{t('settings.secureSignIn')}</AppText>
            <AppText muted style={styles.appleNoticeText}>
              {t('settings.thisAccountUsesGoogleOrAppleSignInInsteadOf')}
            </AppText>
          </View>
        </AccountCard>
      </AccountScaffold>
    );
  }

  const submit = async () => {
    if (newPassword !== confirmation) {
      showToast({
        type: 'warning',
        title: t('settings.passwordsDonTMatch'),
        message: t('settings.enterTheSameNewPasswordInBothFields'),
      });
      return;
    }

    if (!isStrongPassword(newPassword)) {
      showToast({
        type: 'warning',
        title: t('settings.chooseAStrongerPassword'),
        message: t('settings.useAtLeast8CharactersIncludingAnUppercaseLetterA'),
      });
      return;
    }

    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      showToast({
        type: 'success',
        title: t('settings.passwordChanged'),
        message: t('settings.youVeBeenSignedOutOfAllSessionsForSecurity'),
      });
      router.replace('/(auth)/sign-in');
    } catch (error) {
      showToast({
        type: 'error',
        title: t('settings.couldnTChangePassword'),
        message: error instanceof Error ? error.message : t('common.tryAgainShort'),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AccountScaffold
      title={t('settings.changePassword')}
      subtitle={t('settings.youLlNeedToSignInAgainOnAllDevices')}
    >
      <AccountCard>
        <PasswordField
          label={t('settings.currentPassword')}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          autoComplete="current-password"
          textContentType="password"
        />
        <PasswordField
          label={t('settings.newPassword')}
          value={newPassword}
          onChangeText={setNewPassword}
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <PasswordField
          label={t('settings.confirmNewPassword')}
          value={confirmation}
          onChangeText={setConfirmation}
          autoComplete="new-password"
          textContentType="newPassword"
          onSubmitEditing={() => void submit()}
        />
        <View style={styles.ruleBox}>
          <Ionicons
            name="information-circle-outline"
            size={17}
            color={colors.secondaryText}
          />
          <AppText muted style={styles.ruleText}>
            {t('settings.useAtLeast8CharactersIncludingAnUppercaseLetterA_7abfc')}
          </AppText>
        </View>
        <SpringPressable
          accessibilityRole="button"
          accessibilityLabel={t('settings.changePassword')}
          disabled={saving}
          haptic="light"
          onPress={() => void submit()}
          style={[accountStyles.primaryButton, saving && styles.disabledButton]}
        >
          {saving ? (
            <ActivityIndicator color={colors.onAccent} />
          ) : (
            <Ionicons name="key" size={18} color={colors.onAccent} />
          )}
          <AppText style={accountStyles.primaryButtonText}>
            {t('settings.changePassword')}
          </AppText>
        </SpringPressable>
      </AccountCard>
    </AccountScaffold>
  );
}

const styles = StyleSheet.create({
  ruleBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ruleText: { flex: 1, fontSize: 12, lineHeight: 17 },
  appleHero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    textAlign: 'center',
  },
  appleIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  appleNoticeText: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: spacing.sm,
  },
  disabledButton: { opacity: 0.6 },
});
